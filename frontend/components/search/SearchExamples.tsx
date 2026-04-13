"use client";

import type { SearchMode } from "@/lib/types";

const EXAMPLES: Record<SearchMode, { label: string; query: string }[]> = {
  protein: [
    { label: "BRAF V600E", query: "BRAF:p.V600E" },
    { label: "KRAS G12D", query: "KRAS:p.G12D" },
    { label: "PIK3CA E545K", query: "PIK3CA:p.E545K" },
    { label: "EGFR L858R", query: "EGFR:p.L858R" },
  ],
  cdna: [
    { label: "BRAF c.1799T>A", query: "BRAF:c.1799T>A" },
    { label: "KRAS c.35G>A", query: "KRAS:c.35G>A" },
    { label: "PIK3CA c.1633G>A", query: "PIK3CA:c.1633G>A" },
    { label: "EGFR c.2573T>G", query: "EGFR:c.2573T>G" },
  ],
  genomic: [
    { label: "BRAF V600E (hg38)", query: "chr7:g.140753336A>T" },
    { label: "KRAS G12D (hg38)", query: "chr12:g.25245350C>T" },
    { label: "PIK3CA E545K (hg38)", query: "chr3:g.179218303G>A" },
    { label: "EGFR L858R (hg38)", query: "chr7:g.55191822T>G" },
  ],
};

interface Props {
  mode: SearchMode;
  onSelect: (query: string) => void;
}

export default function SearchExamples({ mode, onSelect }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-gray-400">Try:</span>
      {EXAMPLES[mode].map((ex) => (
        <button
          key={ex.query}
          type="button"
          onClick={() => onSelect(ex.query)}
          className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 hover:border-blue-300 hover:text-blue-700 transition-colors"
        >
          {ex.label}
        </button>
      ))}
    </div>
  );
}
