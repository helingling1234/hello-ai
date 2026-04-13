import type { SearchMode } from "@/lib/types";

const PROTEIN_RE = /^[A-Za-z0-9_\-]+:p\.[A-Za-z]+\d+[A-Za-z*=?]+$/;
const CDNA_RE = /^[A-Za-z0-9_\-]+:c\./;
const GENOMIC_RE = /^chr[\dXYMT]+:g\./i;

export function validateQuery(query: string, mode: SearchMode): string | null {
  const q = query.trim();
  if (!q) return "Query must not be empty.";

  switch (mode) {
    case "protein":
      if (!PROTEIN_RE.test(q))
        return 'Invalid protein notation. Example: PIK3CA:p.E545K';
      break;
    case "cdna":
      if (!CDNA_RE.test(q))
        return 'Invalid cDNA notation. Example: PIK3CA:c.1633G>A';
      break;
    case "genomic":
      if (!GENOMIC_RE.test(q))
        return 'Invalid genomic notation. Example: chr3:g.178936091G>A';
      break;
  }

  return null;
}
