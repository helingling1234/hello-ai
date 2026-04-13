import type { TranscriptAnnotation } from "@/lib/types";
import { formatConsequence, formatCoordinates, consequenceSeverity } from "@/utils/formatters";
import Badge from "@/components/ui/Badge";

const SEVERITY_COLORS = {
  high: "bg-red-100 text-red-700",
  moderate: "bg-orange-100 text-orange-700",
  low: "bg-green-100 text-green-700",
  unknown: "bg-gray-100 text-gray-600",
};

interface Props {
  transcripts: TranscriptAnnotation[];
}

export default function TranscriptTable({ transcripts }: Props) {
  if (transcripts.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">
        No transcripts found. Check that TransVar annotation databases are installed.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <th className="py-2 pr-4">Transcript</th>
            <th className="py-2 pr-4">Gene</th>
            <th className="py-2 pr-4">Genomic</th>
            <th className="py-2 pr-4">cDNA</th>
            <th className="py-2 pr-4">Protein</th>
            <th className="py-2 pr-4">Consequence</th>
            <th className="py-2 pr-4">Region</th>
            <th className="py-2">DB</th>
          </tr>
        </thead>
        <tbody>
          {transcripts.map((t, i) => (
            <tr key={`${t.transcript_id}-${i}`} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-2 pr-4 font-mono text-xs text-blue-700">{t.transcript_id}</td>
              <td className="py-2 pr-4 font-semibold">{t.gene}</td>
              <td className="py-2 pr-4 font-mono text-xs">{formatCoordinates(t)}</td>
              <td className="py-2 pr-4 font-mono text-xs">{t.cdna_change ?? "—"}</td>
              <td className="py-2 pr-4 font-mono text-xs">{t.protein_change ?? "—"}</td>
              <td className="py-2 pr-4">
                {t.consequence ? (
                  <Badge
                    label={formatConsequence(t.consequence)}
                    className={SEVERITY_COLORS[consequenceSeverity(t.consequence)]}
                  />
                ) : "—"}
              </td>
              <td className="py-2 pr-4 text-xs text-gray-600">{t.region ?? "—"}</td>
              <td className="py-2 text-xs text-gray-500">{t.database ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
