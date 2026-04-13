from fastapi import APIRouter, Query, HTTPException
from app.models.responses import DiseaseResponse
from app.services import clinvar as clinvar_svc

router = APIRouter()


@router.get("/disease", response_model=DiseaseResponse)
async def get_disease(
    gene: str = Query(..., description="Gene symbol, e.g. BRAF"),
    cdna: str = Query("", description="cDNA change, e.g. c.1799T>A"),
    genomic: str = Query("", description="Genomic coordinate, e.g. chr7:g.140453136A>T"),
) -> DiseaseResponse:
    try:
        return await clinvar_svc.search(gene=gene, cdna=cdna, genomic=genomic)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"ClinVar search failed: {e}")
