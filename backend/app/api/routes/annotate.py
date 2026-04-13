from fastapi import APIRouter, HTTPException
from app.models.requests import AnnotateRequest
from app.models.responses import AnnotateResponse
from app.services import transvar as transvar_svc

router = APIRouter()


@router.post("/annotate", response_model=AnnotateResponse)
async def annotate_mutation(req: AnnotateRequest) -> AnnotateResponse:
    try:
        transcripts = await transvar_svc.annotate(req.query, req.mode)
    except transvar_svc.TransvarTimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except transvar_svc.TransvarError as e:
        err = str(e)
        # Return structured response with error instead of 500 for bad input
        return AnnotateResponse(
            query=req.query,
            mode=req.mode,
            transcripts=[],
            error=err,
        )

    return AnnotateResponse(
        query=req.query,
        mode=req.mode,
        transcripts=transcripts,
    )
