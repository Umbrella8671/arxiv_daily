from __future__ import annotations

from datetime import date, datetime, timezone
import json

from arxiv_ai_rss.fetch_arxiv import Paper
from arxiv_ai_rss.summarize import SummaryResult


def render_paper_markdown(
    paper: Paper,
    summary: SummaryResult,
    *,
    generated_date: date | None = None,
) -> str:
    published = paper.published.astimezone(timezone.utc).date().isoformat()
    generated = (generated_date or datetime.now(timezone.utc).date()).isoformat()
    authors = ", ".join(paper.authors)
    categories = ", ".join(paper.categories)

    return "\n".join(
        [
            "---",
            f"arxiv_id: {json.dumps(paper.arxiv_id)}",
            f"title: {json.dumps(paper.title)}",
            f"published: {json.dumps(published)}",
            f"generated: {json.dumps(generated)}",
            f"arxiv_url: {json.dumps(paper.arxiv_url)}",
            f"pdf_url: {json.dumps(paper.pdf_url)}",
            "---",
            "",
            f"# {paper.title}",
            "",
            f"- **Authors:** {authors}",
            f"- **Published:** {published}",
            f"- **Categories:** {categories}",
            f"- **arXiv:** [{paper.arxiv_url}]({paper.arxiv_url})",
            f"- **PDF:** [{paper.pdf_url}]({paper.pdf_url})",
            "",
            "## Abstract",
            "",
            paper.abstract,
            "",
            "## Research content",
            "",
            summary.research_content,
            "",
            "## Problem addressed",
            "",
            summary.problem_addressed,
            "",
            "## Limitations",
            "",
            _render_list(summary.limitations),
            "",
            "## Possible improvement directions",
            "",
            _render_list(summary.possible_improvements),
            "",
        ]
    )


def _render_list(items: list[str]) -> str:
    if not items:
        return "- Not specified."
    return "\n".join(f"- {item}" for item in items)
