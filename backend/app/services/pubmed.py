"""
PubMed search via NCBI E-utilities.
Two-step: ESearch to get PMIDs, then EFetch to get abstracts (XML).
"""

import xml.etree.ElementTree as ET
from typing import Optional
import httpx
from app.models.responses import PubMedArticle, LiteratureResponse
from app.utils.cache import get_cached, set_cached
from app.config import settings

ESEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
EFETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"

_client: Optional[httpx.AsyncClient] = None


def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(timeout=20.0)
    return _client


async def close_client() -> None:
    global _client
    if _client and not _client.is_closed:
        await _client.aclose()


def _build_search_term(gene: str, mutation: str) -> str:
    parts = []
    if gene:
        parts.append(f'"{gene}"[Gene Name]')
    if mutation:
        parts.append(f'"{mutation}"')
    parts.append("(mutation OR variant OR cancer OR disease OR pathogenic)")
    return " AND ".join(parts)


def _parse_articles(xml_text: str) -> list[PubMedArticle]:
    articles = []
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return articles

    for article_el in root.findall(".//PubmedArticle"):
        pmid_el = article_el.find(".//PMID")
        pmid = pmid_el.text.strip() if pmid_el is not None and pmid_el.text else ""
        if not pmid:
            continue

        title_el = article_el.find(".//ArticleTitle")
        title = "".join(title_el.itertext()).strip() if title_el is not None else "(no title)"

        # Authors
        authors = []
        for author_el in article_el.findall(".//Author"):
            last = author_el.findtext("LastName", "")
            initials = author_el.findtext("Initials", "")
            name = f"{last} {initials}".strip()
            if name:
                authors.append(name)

        journal_el = article_el.find(".//Journal/Title")
        journal = journal_el.text.strip() if journal_el is not None and journal_el.text else None

        year_el = article_el.find(".//PubDate/Year")
        year = None
        if year_el is not None and year_el.text:
            try:
                year = int(year_el.text.strip())
            except ValueError:
                pass

        abstract_el = article_el.find(".//AbstractText")
        abstract = "".join(abstract_el.itertext()).strip() if abstract_el is not None else None

        articles.append(PubMedArticle(
            pmid=pmid,
            title=title,
            authors=authors,
            journal=journal,
            year=year,
            abstract=abstract,
            url=f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
        ))

    return articles


async def search(gene: str, mutation: str = "", max_results: int = 10) -> LiteratureResponse:
    cache_key = (gene.lower(), mutation.lower(), max_results)
    cached = get_cached("literature", cache_key)
    if cached is not None:
        return cached

    client = get_client()
    term = _build_search_term(gene, mutation)

    params: dict = {
        "db": "pubmed",
        "term": term,
        "retmax": max_results,
        "retmode": "json",
        "sort": "relevance",
    }
    if settings.ncbi_api_key:
        params["api_key"] = settings.ncbi_api_key

    resp = await client.get(ESEARCH_URL, params=params)
    resp.raise_for_status()
    data = resp.json()

    pmids: list[str] = data.get("esearchresult", {}).get("idlist", [])
    total = int(data.get("esearchresult", {}).get("count", 0))

    articles: list[PubMedArticle] = []
    if pmids:
        fetch_params: dict = {
            "db": "pubmed",
            "id": ",".join(pmids),
            "rettype": "abstract",
            "retmode": "xml",
        }
        if settings.ncbi_api_key:
            fetch_params["api_key"] = settings.ncbi_api_key

        fetch_resp = await client.get(EFETCH_URL, params=fetch_params)
        fetch_resp.raise_for_status()
        articles = _parse_articles(fetch_resp.text)

    result = LiteratureResponse(articles=articles, total=total, query_used=term)
    set_cached("literature", cache_key, result)
    return result
