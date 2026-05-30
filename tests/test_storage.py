from datetime import date, datetime, timezone

from arxiv_ai_rss.fetch_arxiv import Paper
from arxiv_ai_rss.storage import (
    daily_rss_path,
    deduplicate_papers,
    existing_paper_ids,
    prune_old_outputs,
    rss_items_generated_on,
    rss_items_from_paths,
    write_paper_markdown,
)
from arxiv_ai_rss.summarize import SummaryResult


def test_deduplicate_papers_keeps_first_paper_for_each_arxiv_id() -> None:
    first = _paper("1234.00001", "First")
    duplicate = _paper("1234.00001", "Duplicate")
    second = _paper("1234.00002", "Second")

    assert deduplicate_papers([first, duplicate, second]) == [first, second]


def test_existing_paper_ids_reads_markdown_front_matter(tmp_path) -> None:
    path = write_paper_markdown(tmp_path, _paper("1234.00001", "First"), _summary(), generated_date=date(2026, 5, 30))

    assert existing_paper_ids(tmp_path) == {"1234.00001"}
    assert path.parent == tmp_path / "2026-05-30"


def test_rss_items_from_paths_only_uses_given_markdown_files(tmp_path) -> None:
    first_path = write_paper_markdown(tmp_path, _paper("1234.00001", "First"), _summary())
    write_paper_markdown(tmp_path, _paper("1234.00002", "Second"), _summary())

    items = rss_items_from_paths([first_path], "https://example.test")

    assert [item["title"] for item in items] == ["First"]
    assert "arXiv: https://arxiv.org/abs/1234.00001" in items[0]["description"]
    assert "PDF: https://arxiv.org/pdf/1234.00001" in items[0]["description"]
    assert "Authors: Ada Lovelace" in items[0]["description"]
    assert "Published: 2026-01-01" in items[0]["description"]
    assert "Categories: cs.AI" in items[0]["description"]
    assert "Abstract: A concise abstract." in items[0]["description"]
    assert "Research content: Research content." in items[0]["description"]
    assert "Problem addressed: Problem addressed." in items[0]["description"]
    assert "Limitations: - Limitation." in items[0]["description"]
    assert "Possible improvement directions: - Improvement." in items[0]["description"]


def test_rss_items_generated_on_uses_all_markdown_generated_that_day(tmp_path) -> None:
    write_paper_markdown(
        tmp_path,
        _paper("1234.00001", "Today"),
        _summary(),
        generated_date=date(2026, 5, 30),
    )
    write_paper_markdown(
        tmp_path,
        _paper("1234.00002", "Yesterday"),
        _summary(),
        generated_date=date(2026, 5, 29),
    )

    items = rss_items_generated_on(tmp_path, "https://example.test", date(2026, 5, 30))

    assert [item["title"] for item in items] == ["Today"]


def test_prune_old_outputs_keeps_latest_15_days(tmp_path) -> None:
    markdown_dir = tmp_path / "papers"
    rss_dir = tmp_path / "rss"
    old_markdown = write_paper_markdown(
        markdown_dir,
        _paper("1234.00001", "Old", published=datetime(2026, 5, 15, tzinfo=timezone.utc)),
        _summary(),
        generated_date=date(2026, 5, 15),
    )
    recent_markdown = write_paper_markdown(
        markdown_dir,
        _paper("1234.00002", "Recent", published=datetime(2026, 5, 16, tzinfo=timezone.utc)),
        _summary(),
        generated_date=date(2026, 5, 16),
    )
    old_rss = daily_rss_path(rss_dir, date(2026, 5, 15))
    recent_rss = daily_rss_path(rss_dir, date(2026, 5, 16))
    old_rss.parent.mkdir(parents=True)
    old_rss.write_text("<rss />", encoding="utf-8")
    recent_rss.write_text("<rss />", encoding="utf-8")

    deleted = prune_old_outputs(markdown_dir, rss_dir, 15, date(2026, 5, 30))

    assert old_markdown.parent in deleted
    assert old_rss in deleted
    assert not old_markdown.exists()
    assert not old_markdown.parent.exists()
    assert not old_rss.exists()
    assert recent_markdown.exists()
    assert recent_rss.exists()


def _paper(
    arxiv_id: str,
    title: str,
    *,
    published: datetime = datetime(2026, 1, 1, tzinfo=timezone.utc),
) -> Paper:
    return Paper(
        arxiv_id=arxiv_id,
        title=title,
        authors=["Ada Lovelace"],
        arxiv_url=f"https://arxiv.org/abs/{arxiv_id}",
        pdf_url=f"https://arxiv.org/pdf/{arxiv_id}",
        published=published,
        abstract="A concise abstract.",
        categories=["cs.AI"],
    )


def _summary() -> SummaryResult:
    return SummaryResult(
        research_content="Research content.",
        problem_addressed="Problem addressed.",
        limitations=["Limitation."],
        possible_improvements=["Improvement."],
    )
