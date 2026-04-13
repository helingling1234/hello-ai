"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SearchMode } from "@/lib/types";
import SearchModeSelector from "@/components/search/SearchModeSelector";
import SearchExamples from "@/components/search/SearchExamples";
import SearchBar from "@/components/search/SearchBar";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<SearchMode>("protein");
  const [prefilledQuery, setPrefilledQuery] = useState("");

  function handleSearch(q: string, m: SearchMode) {
    router.push(`/results?q=${encodeURIComponent(q)}&mode=${m}`);
  }

  function handleModeChange(m: SearchMode) {
    setMode(m);
    setPrefilledQuery("");
  }

  function handleExample(q: string) {
    setPrefilledQuery(q);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900">
            Mut<span className="text-blue-600">Search</span>
          </h1>
          <p className="text-gray-500 text-base">
            Search genetic mutations &middot; Annotate variants &middot; Explore disease impact
          </p>
          <p className="text-xs text-gray-400">
            Powered by TransVar &middot; PubMed &middot; ClinVar
          </p>
        </div>

        {/* Search card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <SearchModeSelector mode={mode} onChange={handleModeChange} />
          <SearchBar
            initialQuery={prefilledQuery}
            initialMode={mode}
            onSearch={handleSearch}
            compact
          />
          <SearchExamples mode={mode} onSelect={handleExample} />
        </div>

        {/* Feature tiles */}
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            {
              icon: "🧬",
              title: "Annotate",
              desc: "Resolve mutations across protein, cDNA, and genomic coordinates via TransVar",
            },
            {
              icon: "📄",
              title: "Literature",
              desc: "Find relevant PubMed papers about a mutation's role in disease",
            },
            {
              icon: "🏥",
              title: "Diseases",
              desc: "Retrieve ClinVar pathogenicity classifications and associated conditions",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="text-sm font-semibold text-gray-800">{item.title}</div>
              <div className="mt-1 text-xs text-gray-500 leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
