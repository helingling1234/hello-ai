"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import type { SearchMode } from "@/lib/types";
import AnnotationPanel from "@/components/results/AnnotationPanel";
import LiteraturePanel from "@/components/results/LiteraturePanel";
import DiseasePanel from "@/components/results/DiseasePanel";
import SearchBar from "@/components/search/SearchBar";
import Link from "next/link";

function extractGeneAndMutation(query: string, mode: SearchMode): { gene: string; mutation: string; cdna: string } {
  // e.g. "BRAF:p.V600E" -> gene=BRAF, mutation=V600E
  // e.g. "BRAF:c.1799T>A" -> gene=BRAF, cdna=c.1799T>A
  const colonIdx = query.indexOf(":");
  const gene = colonIdx > 0 ? query.slice(0, colonIdx) : query;
  let mutation = "";
  let cdna = "";

  if (mode === "protein") {
    // p.V600E -> V600E
    const pIdx = query.indexOf("p.");
    mutation = pIdx >= 0 ? query.slice(pIdx + 2) : query.slice(colonIdx + 1);
  } else if (mode === "cdna") {
    cdna = colonIdx > 0 ? query.slice(colonIdx + 1) : "";
    // c.1799T>A -> 1799T>A for literature search
    mutation = cdna.replace(/^c\./, "");
  } else {
    // genomic: use gene as-is, no specific mutation label
    mutation = query.slice(colonIdx + 1) ?? "";
  }

  return { gene, mutation, cdna };
}

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const q = searchParams.get("q") ?? "";
  const mode = (searchParams.get("mode") ?? "protein") as SearchMode;

  const { gene, mutation, cdna } = useMemo(
    () => extractGeneAndMutation(q, mode),
    [q, mode]
  );

  function handleNewSearch(newQ: string, newMode: SearchMode) {
    router.push(`/results?q=${encodeURIComponent(newQ)}&mode=${newMode}`);
  }

  if (!q) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">No query provided. <Link href="/" className="text-blue-600 hover:underline">Go back</Link></p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header / search bar */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <Link href="/" className="text-xl font-extrabold text-gray-900 shrink-0">
            Mut<span className="text-blue-600">Search</span>
          </Link>
          <div className="flex-1 max-w-xl">
            <SearchBar
              initialQuery={q}
              initialMode={mode}
              onSearch={handleNewSearch}
              compact
            />
          </div>
        </div>
      </header>

      {/* Query summary */}
      <div className="mx-auto max-w-5xl px-4 py-4">
        <p className="text-sm text-gray-500">
          Results for{" "}
          <span className="font-mono font-semibold text-gray-800">{q}</span>
          {" "}({mode} mode)
        </p>
      </div>

      {/* Three panels — load in parallel */}
      <div className="mx-auto max-w-5xl space-y-4 px-4 pb-12">
        <AnnotationPanel query={q} mode={mode} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <LiteraturePanel gene={gene} mutation={mutation} />
          <DiseasePanel gene={gene} cdna={cdna} />
        </div>
      </div>
    </main>
  );
}
