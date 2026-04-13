import type {
  AnnotateResponse,
  LiteratureResponse,
  DiseaseResponse,
  SearchMode,
} from "./types";

const BASE = "/api";

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export async function annotate(query: string, mode: SearchMode): Promise<AnnotateResponse> {
  return fetchJSON<AnnotateResponse>(`${BASE}/annotate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, mode }),
  });
}

export async function fetchLiterature(
  gene: string,
  mutation: string,
  maxResults = 10
): Promise<LiteratureResponse> {
  const params = new URLSearchParams({ gene, mutation, max_results: String(maxResults) });
  return fetchJSON<LiteratureResponse>(`${BASE}/literature?${params}`);
}

export async function fetchDisease(
  gene: string,
  cdna = "",
  genomic = ""
): Promise<DiseaseResponse> {
  const params = new URLSearchParams({ gene, cdna, genomic });
  return fetchJSON<DiseaseResponse>(`${BASE}/disease?${params}`);
}
