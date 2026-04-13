"use client";

import { useEffect, useState } from "react";
import { fetchDisease } from "@/lib/api";
import type { DiseaseResponse, ClinVarVariant } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Badge from "@/components/ui/Badge";
import ExternalLink from "@/components/ui/ExternalLink";
import { significanceColor } from "@/utils/formatters";

function VariantCard({ variant }: { variant: ClinVarVariant }) {
  return (
    <div className="border-b border-gray-100 py-4 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <ExternalLink href={variant.url} className="text-sm font-medium text-gray-900 hover:text-blue-700 leading-snug">
          {variant.title ?? `ClinVar #${variant.clinvar_id}`}
        </ExternalLink>
        {variant.significance && (
          <Badge
            label={variant.significance}
            className={`flex-shrink-0 ${significanceColor(variant.significance)}`}
          />
        )}
      </div>
      {variant.conditions.length > 0 && (
        <p className="mt-1 text-xs text-gray-600">
          <span className="font-medium">Conditions:</span>{" "}
          {variant.conditions.slice(0, 3).join(", ")}
          {variant.conditions.length > 3 && ` +${variant.conditions.length - 3} more`}
        </p>
      )}
      <div className="mt-1 flex gap-3 text-xs text-gray-400">
        {variant.review_status && <span>{variant.review_status}</span>}
        {variant.last_evaluated && <span>Evaluated: {variant.last_evaluated}</span>}
        <ExternalLink href={variant.url} className="text-blue-400 text-xs">
          ClinVar {variant.clinvar_id}
        </ExternalLink>
      </div>
    </div>
  );
}

interface Props {
  gene: string;
  cdna: string;
}

export default function DiseasePanel({ gene, cdna }: Props) {
  const [data, setData] = useState<DiseaseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData(null);
    setError(null);

    fetchDisease(gene, cdna)
      .then((res) => {
        if (!cancelled) { setData(res); setLoading(false); }
      })
      .catch((err) => {
        if (!cancelled) { setError(err.message ?? "Disease lookup failed"); setLoading(false); }
      });

    return () => { cancelled = true; };
  }, [gene, cdna]);

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-base font-semibold text-gray-800">
          Disease Associations
          <span className="ml-2 text-xs font-normal text-gray-400">via ClinVar</span>
          {data && (
            <span className="ml-1 text-xs font-normal text-gray-400">
              · {data.total} result{data.total !== 1 ? "s" : ""}
            </span>
          )}
        </h2>
      </div>
      <div className="p-5">
        {loading && <LoadingSpinner message="Querying ClinVar..." />}
        {!loading && error && <ErrorBanner message={error} />}
        {!loading && data && data.variants.length === 0 && (
          <p className="text-sm text-gray-500 italic">No ClinVar entries found for this gene/variant.</p>
        )}
        {!loading && data && data.variants.map((v) => (
          <VariantCard key={v.clinvar_id} variant={v} />
        ))}
      </div>
    </section>
  );
}
