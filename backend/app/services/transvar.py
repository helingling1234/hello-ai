"""
TransVar subprocess wrapper and output parser.

TransVar is a command-line tool; we invoke it as an async subprocess and parse
its tab-delimited output into structured Pydantic models.

Output format (tab-separated columns):
  0: input query
  1: transcript info  (e.g. "ENST00000263967 (protein_coding)")
  2: gene name
  3: strand (+/-)
  4: coordinates  (e.g. "chr3:g.178936091G>A/c.1633G>A/p.E545K")
  5: region  (e.g. "inside_[cds_in_exon_10]")
  6: info blob  (e.g. "CSQN=Missense;reference_codon=GAG;...")
"""

import asyncio
import re
from typing import Optional
from app.models.responses import TranscriptAnnotation, GenomicCoordinates
from app.utils.cache import get_cached, set_cached

TRANSVAR_COMMANDS = {
    "protein": "panno",
    "cdna": "canno",
    "genomic": "ganno",
}

# Matches e.g. "chr3:g.178936091G>A" or "chr3:g.178936091_178936092delGT"
GENOMIC_RE = re.compile(
    r"(chr[\dXYMTUV]+):g\.(\d+)(?:_(\d+))?([ACGT]+)?(?:>([ACGT]+)|del([ACGT]*)|ins([ACGT]+)|dup([ACGT]*))?"
)


class TransvarError(Exception):
    pass


class TransvarTimeoutError(TransvarError):
    pass


def _parse_info_blob(blob: str) -> dict:
    """Parse 'KEY=value;KEY2=value2' into a dict."""
    result = {}
    for part in blob.split(";"):
        part = part.strip()
        if "=" in part:
            k, _, v = part.partition("=")
            result[k.strip()] = v.strip()
        elif part:
            result[part] = ""
    return result


def _parse_coordinates(coord_field: str) -> tuple[Optional[GenomicCoordinates], Optional[str], Optional[str]]:
    """
    Parse the coordinates field: 'chr3:g.178936091G>A/c.1633G>A/p.E545K'
    Returns (GenomicCoordinates, cdna_change, protein_change)
    """
    parts = coord_field.split("/")
    genomic_str = parts[0] if parts else ""
    cdna = parts[1].strip() if len(parts) > 1 else None
    protein = parts[2].strip() if len(parts) > 2 else None

    # Clean up cdna/protein (may have leading whitespace from transvar)
    if cdna and not cdna.startswith("c."):
        cdna = None
    if protein and not protein.startswith("p."):
        protein = None

    m = GENOMIC_RE.match(genomic_str.strip())
    coords = None
    if m:
        chrom = m.group(1)
        start = int(m.group(2)) if m.group(2) else None
        end = int(m.group(3)) if m.group(3) else start
        ref = m.group(4)
        alt = m.group(5)
        coords = GenomicCoordinates(
            chromosome=chrom,
            genomic_start=start,
            genomic_end=end,
            ref=ref,
            alt=alt,
            genomic_hgvs=genomic_str.strip(),
        )

    return coords, cdna, protein


def _consequence_from_csqn(csqn: str) -> str:
    """Map TransVar CSQN values to readable consequence strings."""
    mapping = {
        "Missense": "missense_variant",
        "Nonsense": "stop_gained",
        "Synonymous": "synonymous_variant",
        "Frameshift": "frameshift_variant",
        "InFrameDeletion": "inframe_deletion",
        "InFrameInsertion": "inframe_insertion",
        "SpliceAcceptor": "splice_acceptor_variant",
        "SpliceDonor": "splice_donor_variant",
        "ReadThrough": "stop_lost",
        "StartLost": "start_lost",
    }
    return mapping.get(csqn, csqn.lower())


def _parse_transvar_output(raw: str, query: str) -> list[TranscriptAnnotation]:
    """Parse TransVar tab-delimited output into a list of TranscriptAnnotation."""
    results = []
    lines = raw.strip().splitlines()

    for line in lines:
        # Skip header/comment lines
        if not line or line.startswith("#") or line.startswith("input"):
            continue

        cols = line.split("\t")
        if len(cols) < 4:
            continue

        # TransVar output columns:
        # 0: input, 1: transcript (gene) info, 2: gene, 3: strand, 4: coordinates, 5: region, 6: info
        transcript_info = cols[1].strip() if len(cols) > 1 else ""
        gene = cols[2].strip() if len(cols) > 2 else ""
        strand = cols[3].strip() if len(cols) > 3 else None
        coord_field = cols[4].strip() if len(cols) > 4 else ""
        region = cols[5].strip() if len(cols) > 5 else None
        info_str = cols[6].strip() if len(cols) > 6 else ""

        # Extract transcript ID from "ENST00000263967 (protein_coding)"
        transcript_id = transcript_info.split()[0] if transcript_info else "unknown"
        # Some lines may have "." as transcript (no hit)
        if transcript_id in (".", ""):
            continue

        # Skip "no_valid_transcript_found" lines
        if "no_valid_transcript_found" in transcript_info or "no_valid_transcript_found" in coord_field:
            continue

        # Detect database from transcript ID prefix
        db = None
        if transcript_id.startswith("ENST"):
            db = "Ensembl"
        elif transcript_id.startswith("NM_") or transcript_id.startswith("NP_"):
            db = "RefSeq"
        elif transcript_id.startswith("uc"):
            db = "UCSC"
        elif transcript_id.startswith("CCDS"):
            db = "CCDS"

        coords, cdna, protein = _parse_coordinates(coord_field)
        info = _parse_info_blob(info_str)

        csqn = info.get("CSQN", "")
        consequence = _consequence_from_csqn(csqn) if csqn else None

        # Clean region string: "inside_[cds_in_exon_10]" → "exon10"
        region_clean = region
        if region and "exon" in region:
            m = re.search(r"exon_(\d+)", region)
            if m:
                region_clean = f"exon{m.group(1)}"

        results.append(TranscriptAnnotation(
            transcript_id=transcript_id,
            gene=gene or query.split(":")[0],
            strand=strand if strand and strand in ("+", "-") else None,
            coordinates=coords,
            cdna_change=cdna,
            protein_change=protein,
            consequence=consequence,
            region=region_clean,
            database=db,
            info=info,
        ))

    return results


async def annotate(query: str, mode: str) -> list[TranscriptAnnotation]:
    """
    Run TransVar annotation. Returns a list of TranscriptAnnotation objects.
    Results are cached by (query, mode) for 1 hour.
    Raises TransvarError on failure, TransvarTimeoutError on timeout.
    """
    cache_key = (query.strip(), mode)
    cached = get_cached("annotation", cache_key)
    if cached is not None:
        return cached

    verb = TRANSVAR_COMMANDS.get(mode)
    if not verb:
        raise TransvarError(f"Unknown mode: {mode}")

    from app.config import settings
    cmd = [
        "transvar", verb,
        "-i", query.strip(),
        "--refversion", settings.transvar_refversion,
        "--ccds", "--ucsc", "--ensembl",
    ]

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
    except FileNotFoundError:
        raise TransvarError(
            "TransVar is not installed or not in PATH. "
            "Install with: conda install -c bioconda transvar"
        )

    try:
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=30.0)
    except asyncio.TimeoutError:
        proc.kill()
        raise TransvarTimeoutError(f"TransVar timed out for query: {query!r}")

    raw_out = stdout.decode()
    raw_err = stderr.decode().strip()

    # TransVar exits non-zero for missing databases or bad input.
    # If stderr contains a hard error (not just a warning), raise.
    if proc.returncode != 0 and not raw_out.strip():
        raise TransvarError(raw_err or f"TransVar exited with code {proc.returncode}")

    results = _parse_transvar_output(raw_out, query)
    set_cached("annotation", cache_key, results)
    return results
