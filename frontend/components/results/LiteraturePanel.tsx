"use client";

import { useEffect, useState } from "react";
import { fetchLiterature } from "@/lib/api";
import type { LiteratureResponse, PubMedArticle } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorBanner from "@/components/ui/ErrorBanner";
import ExternalLink from "@/components/ui/ExternalLink";

interface ArticleCardProps {
  article: PubMedArticle;
}

function ArticleCard({ article }: ArticleCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-gray-100 py-4 last:border-0">
      <ExternalLink href={article.url} className="font-medium text-gray-900 hover:text-blue-700 text-sm leading-snug">
        {article.title}
      </ExternalLink>
      <p className="mt-1 text-xs text-gray-500">
        {article.authors.slice(0, 3).join(", ")}
        {article.authors.length > 3 && " et al."}
        {article.journal && ` · ${article.journal}`}
        {article.year && ` · ${article.year}`}
        {" · "}
        <ExternalLink href={article.url} className="text-blue-500 text-xs">PMID {article.pmid}</ExternalLink>
      </p>
      {article.abstract && (
        <div className="mt-2">
          {expanded ? (
            <>
              <p className="text-xs text-gray-700 leading-relaxed">{article.abstract}</p>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="mt-1 text-xs text-blue-500 hover:underline"
              >
                Show less
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="text-xs text-blue-500 hover:underline"
            >
              Show abstract
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface Props {
  gene: string;
  mutation: string;
}

export default function LiteraturePanel({ gene, mutation }: Props) {
  const [data, setData] = useState<LiteratureResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData(null);
    setError(null);

    fetchLiterature(gene, mutation)
      .then((res) => {
        if (!cancelled) { setData(res); setLoading(false); }
      })
      .catch((err) => {
        if (!cancelled) { setError(err.message ?? "Literature search failed"); setLoading(false); }
      });

    return () => { cancelled = true; };
  }, [gene, mutation]);

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-base font-semibold text-gray-800">
          PubMed Literature
          {data && (
            <span className="ml-2 text-xs font-normal text-gray-400">
              {data.total} result{data.total !== 1 ? "s" : ""}
            </span>
          )}
        </h2>
      </div>
      <div className="p-5">
        {loading && <LoadingSpinner message="Searching PubMed..." />}
        {!loading && error && <ErrorBanner message={error} />}
        {!loading && data && data.articles.length === 0 && (
          <p className="text-sm text-gray-500 italic">No articles found for this query.</p>
        )}
        {!loading && data && data.articles.map((a) => (
          <ArticleCard key={a.pmid} article={a} />
        ))}
      </div>
    </section>
  );
}
