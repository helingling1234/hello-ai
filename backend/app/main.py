from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.routes import health, annotate, literature, disease
from app.services import pubmed as pubmed_svc
from app.services import clinvar as clinvar_svc


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm up shared HTTP clients on startup
    pubmed_svc.get_client()
    clinvar_svc.get_client()
    yield
    # Graceful shutdown
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
    allow_origins=settings.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(annotate.router, prefix="/api", tags=["annotation"])
app.include_router(literature.router, prefix="/api", tags=["literature"])
app.include_router(disease.router, prefix="/api", tags=["disease"])


@app.get("/")
async def root():
    return {"message": "MutSearch API — visit /docs for interactive API docs"}
