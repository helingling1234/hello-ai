"use client";

import { useState } from "react";
import type { SearchMode } from "@/lib/types";
import SearchModeSelector from "./SearchModeSelector";
import SearchExamples from "./SearchExamples";
import { validateQuery } from "@/utils/validators";

const PLACEHOLDERS: Record<SearchMode, string> = {
  protein: "e.g. BRAF:p.V600E",
  cdna: "e.g. BRAF:c.1799T>A",
  genomic: "e.g. chr7:g.140753336A>T",
};

interface Props {
  initialQuery?: string;
  initialMode?: SearchMode;
  onSearch: (query: string, mode: SearchMode) => void;
  compact?: boolean;
}

export default function SearchBar({ initialQuery = "", initialMode = "protein", onSearch, compact = false }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [mode, setMode] = useState<SearchMode>(initialMode);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateQuery(query, mode);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    onSearch(query.trim(), mode);
  }

  function handleModeChange(newMode: SearchMode) {
    setMode(newMode);
    setError(null);
  }

  function handleExample(q: string) {
    setQuery(q);
    setError(null);
  }

  return (
    <div className="w-full space-y-3">
      {!compact && <SearchModeSelector mode={mode} onChange={handleModeChange} />}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setError(null); }}
            placeholder={PLACEHOLDERS[mode]}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
        >
          Search
        </button>
      </form>
      {!compact && <SearchExamples mode={mode} onSelect={handleExample} />}
    </div>
  );
}
