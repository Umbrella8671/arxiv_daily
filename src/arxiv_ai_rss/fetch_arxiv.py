from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
import re

import arxiv

from arxiv_ai_rss.config import InterestConfig


@dataclass(frozen=True)
class Paper:
    arxiv_id: str
    title: str
    authors: list[str]
    arxiv_url: str
    pdf_url: str
    published: datetime
    abstract: str
    categories: list[str]


def fetch_latest_papers(interests: list[InterestConfig]) -> list[Paper]:
    client = arxiv.Client()
    papers: list[Paper] = []
    for interest in interests:
        search = arxiv.Search(
            query=interest.query,
            max_results=interest.max_results,
            sort_by=arxiv.SortCriterion.SubmittedDate,
            sort_order=arxiv.SortOrder.Descending,
        )
        papers.extend(_paper_from_result(result) for result in client.results(search))
    return papers


def _paper_from_result(result: arxiv.Result) -> Paper:
    arxiv_id = _stable_arxiv_id(result)
    return Paper(
        arxiv_id=arxiv_id,
        title=" ".join(result.title.split()),
        authors=[str(author) for author in result.authors],
        arxiv_url=result.entry_id,
        pdf_url=result.pdf_url,
        published=result.published,
        abstract=" ".join(result.summary.split()),
        categories=list(result.categories),
    )


def _stable_arxiv_id(result: arxiv.Result) -> str:
    get_short_id = getattr(result, "get_short_id", None)
    if callable(get_short_id):
        raw_id = get_short_id()
    else:
        raw_id = result.entry_id.rstrip("/").split("/")[-1]
    return re.sub(r"v\d+$", "", raw_id)
