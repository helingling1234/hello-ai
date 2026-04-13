from pydantic import BaseModel
from typing import Optional


class GenomicCoordinates(BaseModel):
    chromosome: str
    genomic_start: Optional[int] = None
    genomic_end: Optional[int] = None
    ref: Optional[str] = None
    alt: Optional[str] = None
    genomic_hgvs: Optional[str] = None


class TranscriptAnnotation(BaseModel):
    transcript_id: str
    gene: str
    strand: Optional[str] = None
    coordinates: Optional[GenomicCoordinates] = None
    cdna_change: Optional[str] = None
    protein_change: Optional[str] = None
    consequence: Optional[str] = None
    region: Optional[str] = None
    database: Optional[str] = None
    info: dict = {}


class AnnotateResponse(BaseModel):
    query: str
    mode: str
    transcripts: list[TranscriptAnnotation]
    raw_output: Optional[str] = None
    error: Optional[str] = None


class PubMedArticle(BaseModel):
    pmid: str
    title: str
    authors: list[str]
    journal: Optional[str] = None
    year: Optional[int] = None
    abstract: Optional[str] = None
    url: str


class LiteratureResponse(BaseModel):
    articles: list[PubMedArticle]
    total: int
    query_used: str


class ClinVarVariant(BaseModel):
    clinvar_id: str
    title: Optional[str] = None
    significance: Optional[str] = None
    review_status: Optional[str] = None
    conditions: list[str] = []
    last_evaluated: Optional[str] = None
    url: str


class DiseaseResponse(BaseModel):
    variants: list[ClinVarVariant]
    total: int


class HealthResponse(BaseModel):
    status: str
    transvar_available: bool
    transvar_version: Optional[str] = None
    annotation_db: str
