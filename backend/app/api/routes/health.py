import asyncio
from fastapi import APIRouter
from app.models.responses import HealthResponse
from app.config import settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    transvar_available = False
    transvar_version = None

    try:
        proc = await asyncio.create_subprocess_exec(
            "transvar", "--version",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=5.0)
        if proc.returncode == 0:
            transvar_available = True
            raw = (stdout or stderr).decode().strip()
            # version line is typically: "transvar 2.5.x.x"
            transvar_version = raw.splitlines()[0] if raw else None
    except Exception:
        pass

    return HealthResponse(
        status="ok",
        transvar_available=transvar_available,
        transvar_version=transvar_version,
        annotation_db=settings.transvar_refversion,
    )
