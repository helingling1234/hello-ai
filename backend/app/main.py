from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import settings
from app.api.routes import health, annotate, literature, disease
from app.services import pubmed as pubmed_svc
from app.services import clinvar as clinvar_svc

FRONTEND_DIR = Path(__file__).parent.parent.parent / "frontend" / "out"


@asynccontextmanager
async def lifespan(app: FastAPI):
    pubmed_svc.get_client()
    clinvar_svc.get_client()
    yield
    await pubmed_svc.close_client()
    await clinvar_svc.close_client()


app = FastAPI(
    title="MutSearch API",
    description="Mutation gene search: TransVar annotation + PubMed literature + ClinVar disease associations",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes (must be registered before the static files catch-all)
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(annotate.router, prefix="/api", tags=["annotation"])
app.include_router(literature.router, prefix="/api", tags=["literature"])
app.include_router(disease.router, prefix="/api", tags=["disease"])


# Serve the built Next.js frontend (if it exists)
if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
else:
    @app.get("/")
    async def root():
        return {
            "message": "MutSearch API",
            "note": "Frontend not built yet. Run: cd frontend && npm run build",
            "api_docs": "/docs",
        }
