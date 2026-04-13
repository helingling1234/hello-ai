from fastapi import APIRouter, Query, HTTPException
from app.models.responses import LiteratureResponse
from app.services import pubmed as pubmed_svc

router = APIRouter()


@router.get("/literature", response_model=LiteratureResponse)
async def get_literature(
    gene: str = Query(..., description="Gene symbol, e.g. PIK3CA"),
    mutation: str = Query("", description="Mutation label, e.g. E545K"),
    max_results: int = Query(10, ge=1, le=50),
) -> LiteratureResponse:
    try:
        return await pubmed_svc.search(gene=gene, mutation=mutation, max_results=max_results)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"PubMed search failed: {e}")
