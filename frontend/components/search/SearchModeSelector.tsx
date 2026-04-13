"use client";

import type { SearchMode } from "@/lib/types";

const MODES: { value: SearchMode; label: string; description: string }[] = [
  { value: "protein", label: "Protein Change", description: "e.g. PIK3CA:p.E545K" },
  { value: "cdna", label: "cDNA", description: "e.g. PIK3CA:c.1633G>A" },
  { value: "genomic", label: "Genomic Coordinates", description: "e.g. chr3:g.178936091G>A" },
];

interface Props {
  mode: SearchMode;
  onChange: (mode: SearchMode) => void;
}

export default function SearchModeSelector({ mode, onChange }: Props) {
  return (
    <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
      {MODES.map((m) => (
        <button
          key={m.value}
          type="button"
          onClick={() => onChange(m.value)}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mode === m.value
              ? "bg-white text-blue-700 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

export { MODES };
