from __future__ import annotations

from datetime import date, timedelta
from pathlib import Path
import re
import shutil
from typing import Any

import yaml

from arxiv_ai_rss.fetch_arxiv import Paper
from arxiv_ai_rss.render_markdown import render_paper_markdown
from arxiv_ai_rss.summarize import SummaryResult


def deduplicate_papers(papers: list[Paper]) -> list[Paper]:
    seen: set[str] = set()
    deduped: list[Paper] = []
    for paper in papers:
        if paper.arxiv_id in seen:
            continue
        seen.add(paper.arxiv_id)
        deduped.append(paper)
    return deduped


def existing_paper_ids(markdown_dir: str | Path) -> set[str]:
    directory = Path(markdown_dir)
    if not directory.exists():
        return set()

    ids: set[str] = set()
    for path in directory.rglob("*.md"):
        metadata = read_front_matter(path)
        arxiv_id = metadata.get("arxiv_id")
        if isinstance(arxiv_id, str) and arxiv_id:
            ids.add(arxiv_id)
        else:
            ids.add(path.stem.replace("_", "/"))
    return ids


def markdown_path(markdown_dir: str | Path, arxiv_id: str, generated_date: date) -> Path:
    return Path(markdown_dir) / generated_date.isoformat() / f"{safe_filename(arxiv_id)}.md"


def write_paper_markdown(
    markdown_dir: str | Path,
    paper: Paper,
    summary: SummaryResult,
    *,
    generated_date: date | None = None,
) -> Path:
    generated = generated_date or date.today()
    path = markdown_path(markdown_dir, paper.arxiv_id, generated)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(render_paper_markdown(paper, summary, generated_date=generated), encoding="utf-8")
    return path


def rss_items_from_markdown(markdown_dir: str | Path, site_url: str) -> list[dict[str, str]]:
    directory = Path(markdown_dir)
    if not directory.exists():
        return []

    return rss_items_from_paths(directory.rglob("*.md"), site_url)


def rss_items_from_paths(paths: Any, site_url: str) -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    for path in paths:
        path = Path(path)
        metadata = read_front_matter(path)
        title = metadata.get("title")
        arxiv_id = metadata.get("arxiv_id")
        if not isinstance(title, str) or not isinstance(arxiv_id, str):
            continue
        items.append(
            {
                "title": title,
                "link": _site_link(site_url, path),
                "guid": str(metadata.get("arxiv_url", arxiv_id)),
                "description": _rss_description(path, metadata),
                "published": str(metadata.get("published", "")),
            }
        )
    return items


def rss_items_generated_on(markdown_dir: str | Path, site_url: str, generated_on: date) -> list[dict[str, str]]:
    directory = Path(markdown_dir)
    if not directory.exists():
        return []

    paths = []
    for path in directory.rglob("*.md"):
        generated = read_front_matter(path).get("generated")
        if isinstance(generated, str) and _date_from_string(generated) == generated_on:
            paths.append(path)
    return rss_items_from_paths(paths, site_url)


def daily_rss_path(daily_rss_dir: str | Path, run_date: date) -> Path:
    return Path(daily_rss_dir) / f"{run_date.isoformat()}.xml"


def prune_old_outputs(
    markdown_dir: str | Path,
    daily_rss_dir: str | Path,
    retention_days: int,
    today: date,
) -> list[Path]:
    if retention_days < 1:
        raise ValueError("retention_days must be at least 1")

    cutoff = today - timedelta(days=retention_days - 1)
    deleted: list[Path] = []

    markdown_directory = Path(markdown_dir)
    if markdown_directory.exists():
        for path in markdown_directory.iterdir():
            archive_date = _date_from_stem(path)
            if path.is_dir() and archive_date is not None and archive_date < cutoff:
                shutil.rmtree(path)
                deleted.append(path)

        for path in markdown_directory.rglob("*.md"):
            retention_date = _retention_date(path)
            if retention_date is not None and retention_date < cutoff:
                path.unlink()
                deleted.append(path)
                _remove_empty_parent(path.parent, markdown_directory)

    rss_directory = Path(daily_rss_dir)
    if rss_directory.exists():
        for path in rss_directory.glob("*.xml"):
            archive_date = _date_from_stem(path)
            if archive_date is not None and archive_date < cutoff:
                path.unlink()
                deleted.append(path)

    return deleted


def read_front_matter(path: str | Path) -> dict[str, Any]:
    text = Path(path).read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        return {}
    end = text.find("\n---", 4)
    if end == -1:
        return {}
    raw = yaml.safe_load(text[4:end]) or {}
    return raw if isinstance(raw, dict) else {}


def safe_filename(arxiv_id: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]+", "_", arxiv_id)


def _retention_date(path: Path) -> date | None:
    metadata = read_front_matter(path)
    generated = metadata.get("generated")
    if isinstance(generated, str):
        generated_date = _date_from_string(generated)
        if generated_date is not None:
            return generated_date

    published = metadata.get("published")
    if not isinstance(published, str):
        return None
    return _date_from_string(published)


def _date_from_stem(path: Path) -> date | None:
    return _date_from_string(path.stem)


def _date_from_string(value: str) -> date | None:
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def _remove_empty_parent(path: Path, stop_at: Path) -> None:
    try:
        if path != stop_at and not any(path.iterdir()):
            path.rmdir()
    except FileNotFoundError:
        return


def _site_link(site_url: str, path: Path) -> str:
    if not site_url:
        return path.as_posix()
    return f"{site_url.rstrip('/')}/{path.as_posix()}"


def _rss_description(path: Path, metadata: dict[str, Any]) -> str:
    arxiv_url = metadata.get("arxiv_url")
    pdf_url = metadata.get("pdf_url")
    parts = []

    if isinstance(arxiv_url, str) and arxiv_url:
        parts.append(f"arXiv: {arxiv_url}")
    if isinstance(pdf_url, str) and pdf_url:
        parts.append(f"PDF: {pdf_url}")

    for label in ["Authors", "Published", "Categories"]:
        value = _metadata_field(path, label)
        if value:
            parts.append(f"{label}: {value}")

    for heading in [
        "Abstract",
        "Research content",
        "Problem addressed",
        "Limitations",
        "Possible improvement directions",
    ]:
        excerpt = _section_excerpt(path, heading)
        if excerpt:
            parts.append(f"{heading}: {excerpt}")

    return "\n\n".join(parts)


def _section_excerpt(path: Path, heading: str) -> str:
    text = path.read_text(encoding="utf-8")
    marker = f"## {heading}\n\n"
    start = text.find(marker)
    if start == -1:
        return ""
    start += len(marker)
    end = text.find("\n\n## ", start)
    excerpt = text[start:] if end == -1 else text[start:end]
    return " ".join(excerpt.split())


def _metadata_field(path: Path, label: str) -> str:
    text = path.read_text(encoding="utf-8")
    match = re.search(rf"^- \*\*{re.escape(label)}:\*\* (.+)$", text, flags=re.MULTILINE)
    if match is None:
        return ""
    return match.group(1).strip()
