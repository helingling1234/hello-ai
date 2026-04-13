import type { TranscriptAnnotation } from "@/lib/types";

export function formatConsequence(consequence: string | null): string {
  if (!consequence) return "—";
  return consequence
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function formatCoordinates(ann: TranscriptAnnotation): string {
  if (!ann.coordinates) return "—";
  const c = ann.coordinates;
  if (c.genomic_hgvs) return c.genomic_hgvs;
  if (c.chromosome && c.genomic_start) {
    return `${c.chromosome}:${c.genomic_start}`;
  }
  return "—";
}

export function consequenceSeverity(consequence: string | null): "high" | "moderate" | "low" | "unknown" {
  if (!consequence) return "unknown";
  const c = consequence.toLowerCase();
  if (c.includes("stop") || c.includes("frameshift") || c.includes("splice")) return "high";
  if (c.includes("missense") || c.includes("inframe")) return "moderate";
  if (c.includes("synonymous")) return "low";
  return "unknown";
}

export function significanceColor(sig: string | null): string {
  if (!sig) return "bg-gray-100 text-gray-600";
  const s = sig.toLowerCase();
  if (s.includes("pathogenic") && !s.includes("likely")) return "bg-red-100 text-red-700";
  if (s.includes("likely pathogenic")) return "bg-orange-100 text-orange-700";
  if (s.includes("benign") && !s.includes("likely")) return "bg-green-100 text-green-700";
  if (s.includes("likely benign")) return "bg-emerald-100 text-emerald-700";
  if (s.includes("uncertain") || s.includes("vus")) return "bg-yellow-100 text-yellow-700";
  return "bg-gray-100 text-gray-600";
}
