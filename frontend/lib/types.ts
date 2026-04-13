export type SearchMode = "protein" | "cdna" | "genomic";

export interface GenomicCoordinates {
  chromosome: string;
  genomic_start: number | null;
  genomic_end: number | null;
  ref: string | null;
  alt: string | null;
  genomic_hgvs: string | null;
}

export interface TranscriptAnnotation {
  transcript_id: string;
  gene: string;
  strand: string | null;
  coordinates: GenomicCoordinates | null;
  cdna_change: string | null;
  protein_change: string | null;
  consequence: string | null;
  region: string | null;
  database: string | null;
  info: Record<string, string>;
}

export interface AnnotateResponse {
  query: string;
  mode: string;
  transcripts: TranscriptAnnotation[];
  raw_output: string | null;
  error: string | null;
}

export interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string[];
  journal: string | null;
  year: number | null;
  abstract: string | null;
  url: string;
}

export interface LiteratureResponse {
  articles: PubMedArticle[];
  total: number;
  query_used: string;
}

export interface ClinVarVariant {
  clinvar_id: string;
  title: string | null;
  significance: string | null;
  review_status: string | null;
  conditions: string[];
  last_evaluated: string | null;
  url: string;
}

export interface DiseaseResponse {
  variants: ClinVarVariant[];
  total: number;
}
