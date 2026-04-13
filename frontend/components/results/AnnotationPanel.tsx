"use client";

import { useEffect, useState } from "react";
import { annotate } from "@/lib/api";
import type { AnnotateResponse, SearchMode } from "@/lib/types";
import TranscriptTable from "./TranscriptTable";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorBanner from "@/components/ui/ErrorBanner";

interface Props {
  query: string;
  mode: SearchMode;
}

export default function AnnotationPanel({ query, mode }: Props) {
  const [data, setData] = useState<AnnotateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData(null);
    setError(null);

    annotate(query, mode)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message ?? "Annotation failed");
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [query, mode]);

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-base font-semibold text-gray-800">
          Variant Annotation
          <span className="ml-2 text-xs font-normal text-gray-400">via TransVar</span>
        </h2>
      </div>
      <div className="p-5">
        {loading && <LoadingSpinner message="Annotating variant with TransVar..." />}
        {!loading && error && <ErrorBanner message={error} />}
        {!loading && data && data.error && <ErrorBanner message={data.error} />}
        {!loading && data && !data.error && (
          <TranscriptTable transcripts={data.transcripts} />
        )}
      </div>
    </section>
  );
}
