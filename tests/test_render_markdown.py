from datetime import datetime, timezone

from arxiv_ai_rss.fetch_arxiv import Paper
from arxiv_ai_rss.render_markdown import render_paper_markdown
from arxiv_ai_rss.summarize import SummaryResult


def test_render_paper_markdown_includes_required_paper_and_summary_fields() -> None:
    markdown = render_paper_markdown(
        Paper(
            arxiv_id="1234.00001",
            title="A Useful AI Paper",
            authors=["Ada Lovelace", "Alan Turing"],
            arxiv_url="https://arxiv.org/abs/1234.00001",
            pdf_url="https://arxiv.org/pdf/1234.00001",
            published=datetime(2026, 1, 1, tzinfo=timezone.utc),
            abstract="The abstract.",
            categories=["cs.AI", "cs.CL"],
        ),
        SummaryResult(
            research_content="The research content.",
            problem_addressed="The problem.",
            limitations=["One limitation."],
            possible_improvements=["One improvement."],
        ),
        generated_date=datetime(2026, 5, 30, tzinfo=timezone.utc).date(),
    )

    assert 'arxiv_id: "1234.00001"' in markdown
    assert 'generated: "2026-05-30"' in markdown
    assert "# A Useful AI Paper" in markdown
    assert "- **Authors:** Ada Lovelace, Alan Turing" in markdown
    assert "- **Published:** 2026-01-01" in markdown
    assert "## Abstract\n\nThe abstract." in markdown
    assert "## Research content\n\nThe research content." in markdown
    assert "## Problem addressed\n\nThe problem." in markdown
    assert "## Limitations\n\n- One limitation." in markdown
    assert "## Possible improvement directions\n\n- One improvement." in markdown
