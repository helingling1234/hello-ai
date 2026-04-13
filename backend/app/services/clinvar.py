"""
ClinVar disease association lookup via NCBI E-utilities.
ESearch in db=clinvar, then ESummary for variant details.
"""

from typing import Optional
import httpx
from app.models.responses import ClinVarVariant, DiseaseResponse
from app.utils.cache import get_cached, set_cached
from app.config import settings

ESEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
ESUMMARY_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"

_client: Optional[httpx.AsyncClient] = None


def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(timeout=20.0)
    return _client


async def close_client() -> None:
    global _client
    if _client and not _client.is_closed:
        await _client.aclose()


def _parse_significance(sig_obj) -> Optional[str]:
    if isinstance(sig_obj, dict):
        return sig_obj.get("description")
    if isinstance(sig_obj, list) and sig_obj:
        first = sig_obj[0]
        if isinstance(first, dict):
            return first.get("description")
    return None


def _parse_conditions(trait_set) -> list[str]:
    conditions = []
    if isinstance(trait_set, list):
        for trait in trait_set:
            if isinstance(trait, dict):
                name = trait.get("trait_name")
                if name and name not in conditions:
                    conditions.append(name)
    return conditions


def _parse_review_status(status_obj) -> Optional[str]:
    if isinstance(status_obj, str):
        return status_obj
    if isinstance(status_obj, dict):
        return status_obj.get("description")
    return None


async def search(gene: str, cdna: str = "", genomic: str = "") -> DiseaseResponse:
    cache_key = (gene.lower(), cdna.lower(), genomic.lower())
    cached = get_cached("disease", cache_key)
    if cached is not None:
        return cached

    client = get_client()

    # Build ClinVar search term
    term_parts = [f"{gene}[gene]"]
    if cdna:
        term_parts.append(f'"{cdna}"')
    elif genomic:
        term_parts.append(f'"{genomic}"')
    term = " AND ".join(term_parts)

    params: dict = {
        "db": "clinvar",
        "term": term,
        "retmax": 20,
        "retmode": "json",
    }
    if settings.ncbi_api_key:
        params["api_key"] = settings.ncbi_api_key

    resp = await client.get(ESEARCH_URL, params=params)
    resp.raise_for_status()
    data = resp.json()

    ids: list[str] = data.get("esearchresult", {}).get("idlist", [])
    total = int(data.get("esearchresult", {}).get("count", 0))

    variants: list[ClinVarVariant] = []
    if ids:
        summary_params: dict = {
            "db": "clinvar",
            "id": ",".join(ids),
            "retmode": "json",
        }
        if settings.ncbi_api_key:
            summary_params["api_key"] = settings.ncbi_api_key

        sum_resp = await client.get(ESUMMARY_URL, params=summary_params)
        sum_resp.raise_for_status()
        sum_data = sum_resp.json()

        result_map = sum_data.get("result", {})
        for vid in ids:
            entry = result_map.get(vid)
            if not entry or not isinstance(entry, dict):
                continue

            clinvar_id = str(vid)
            title = entry.get("title") or entry.get("variant_set_id")
            sig = _parse_significance(entry.get("clinical_significance"))
            conditions = _parse_conditions(entry.get("trait_set", []))
            review_status = _parse_review_status(entry.get("review_status"))
            last_eval = entry.get("last_evaluated")

            variants.append(ClinVarVariant(
                clinvar_id=clinvar_id,
                title=str(title) if title else None,
                significance=sig,
                review_status=review_status,
                conditions=conditions,
                last_evaluated=last_eval,
                url=f"https://www.ncbi.nlm.nih.gov/clinvar/variation/{clinvar_id}/",
            ))

    result = DiseaseResponse(variants=variants, total=total)
    set_cached("disease", cache_key, result)
    return result
