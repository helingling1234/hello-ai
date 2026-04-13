from pydantic import BaseModel, field_validator
from typing import Literal
import re

PROTEIN_RE = re.compile(r"^[A-Z0-9_\-]+:p\.[A-Za-z*?]+\d+[A-Za-z*?=]+$", re.IGNORECASE)
CDNA_RE = re.compile(r"^[A-Z0-9_\-]+:c\.", re.IGNORECASE)
GENOMIC_RE = re.compile(r"^chr[\dXYMT]+:g\.", re.IGNORECASE)


class AnnotateRequest(BaseModel):
    query: str
    mode: Literal["protein", "cdna", "genomic"]

    @field_validator("query")
    @classmethod
    def query_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("query must not be empty")
        return v
