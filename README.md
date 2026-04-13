# MutSearch

A web application for searching genetic mutations and exploring their impact on disease.

**Features:**
- Variant annotation via [TransVar](https://github.com/zwdzwd/transvar) — resolves mutations across protein, cDNA, and genomic coordinates
- Literature search via [PubMed](https://pubmed.ncbi.nlm.nih.gov/) (NCBI E-utilities)
- Disease associations via [ClinVar](https://www.ncbi.nlm.nih.gov/clinvar/)

## Architecture

```
frontend/   Next.js 16 + TypeScript + Tailwind CSS
backend/    Python FastAPI + TransVar
```

## Prerequisites

- Python 3.10+
- Node.js 20+
- [TransVar](https://github.com/zwdzwd/transvar) (installed via pip)
- ~2 GB disk space for TransVar annotation databases

## Quick Start (local development)

### 1. Backend

```bash
cd backend
pip install -r requirements.txt

# Download TransVar annotation databases (~2 GB, one-time setup)
transvar config --download_anno --refversion hg38

# Copy and edit environment variables
cp .env.example .env
# Optional: add NCBI_API_KEY for higher PubMed rate limits

# Start the API server
uvicorn app.main:app --reload --port 8000
```

Verify: `curl http://localhost:8000/api/health`

### 2. Frontend

```bash
cd frontend
npm install

cp .env.local.example .env.local
# BACKEND_URL=http://localhost:8000  (default — no change needed for local dev)

npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Docker (full stack)

```bash
# Build and start both services
docker compose up --build

# One-time: download TransVar databases into the named volume
docker compose exec backend transvar config --download_anno --refversion hg38
```

## Example Queries

| Mode    | Example                      |
|---------|------------------------------|
| Protein | `BRAF:p.V600E`               |
| Protein | `KRAS:p.G12D`                |
| Protein | `PIK3CA:p.E545K`             |
| Protein | `EGFR:p.L858R`               |
| cDNA    | `BRAF:c.1799T>A`             |
| cDNA    | `KRAS:c.35G>A`               |
| Genomic | `chr7:g.140753336A>T`        |
| Genomic | `chr12:g.25245350C>T`        |

## API Reference

| Endpoint                | Method | Description                              |
|-------------------------|--------|------------------------------------------|
| `/api/health`           | GET    | Health check + TransVar availability     |
| `/api/annotate`         | POST   | Annotate variant with TransVar           |
| `/api/literature`       | GET    | Search PubMed for relevant articles      |
| `/api/disease`          | GET    | Retrieve ClinVar disease associations    |

Interactive docs: `http://localhost:8000/docs`

## Environment Variables

### Backend (`backend/.env`)

| Variable                 | Default    | Description                                  |
|--------------------------|------------|----------------------------------------------|
| `NCBI_API_KEY`           | *(empty)*  | Optional. Raises PubMed rate limit to 10/sec |
| `TRANSVAR_REFVERSION`    | `hg38`     | Reference genome version                     |
| `BACKEND_CORS_ORIGINS`   | `["http://localhost:3000"]` | Allowed frontend origins    |
| `CACHE_TTL_ANNOTATION`   | `3600`     | Annotation cache TTL (seconds)               |
| `CACHE_TTL_LITERATURE`   | `86400`    | Literature cache TTL (seconds)               |
| `CACHE_TTL_DISEASE`      | `86400`    | Disease cache TTL (seconds)                  |

### Frontend (`frontend/.env.local`)

| Variable       | Default                  | Description            |
|----------------|--------------------------|------------------------|
| `BACKEND_URL`  | `http://localhost:8000`  | FastAPI backend URL    |

## Rate Limits

NCBI E-utilities limits unauthenticated requests to **3 per second**. With an API key, this increases to **10 per second**. Get a free API key at [https://www.ncbi.nlm.nih.gov/account/](https://www.ncbi.nlm.nih.gov/account/).
