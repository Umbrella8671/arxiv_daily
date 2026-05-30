from __future__ import annotations

import argparse
from datetime import datetime, timezone

from arxiv_ai_rss.config import load_config
from arxiv_ai_rss.fetch_arxiv import Paper, fetch_latest_papers
from arxiv_ai_rss.render_rss import write_rss
from arxiv_ai_rss.storage import (
    daily_rss_path,
    deduplicate_papers,
    existing_paper_ids,
    prune_old_outputs,
    rss_items_generated_on,
    write_paper_markdown,
)
from arxiv_ai_rss.summarize import summarize_paper


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch, summarize, and publish an arXiv AI RSS digest.")
    parser.add_argument("--config", default="config/interests.yaml", help="Path to the YAML configuration file.")
    parser.add_argument("--dry-run", action="store_true", help="Use deterministic summaries instead of an AI API call.")
    parser.add_argument("--sample-data", action="store_true", help="Use one local sample paper instead of calling arXiv.")
    args = parser.parse_args()

    config = load_config(args.config)
    today = datetime.now(timezone.utc).date()
    papers = _sample_papers() if args.sample_data else fetch_latest_papers(config.interests)
    papers = deduplicate_papers(papers)

    summarized_ids = existing_paper_ids(config.output.markdown_dir)
    new_papers = [paper for paper in papers if paper.arxiv_id not in summarized_ids]

    written_paths = []
    for paper in new_papers:
        summary = summarize_paper(paper, config.ai, dry_run=args.dry_run)
        written_paths.append(write_paper_markdown(config.output.markdown_dir, paper, summary, generated_date=today))

    deleted_paths = prune_old_outputs(
        config.output.markdown_dir,
        config.output.daily_rss_dir,
        config.output.retention_days,
        today,
    )

    written_paths = [path for path in written_paths if path.exists()]
    rss_items = rss_items_generated_on(config.output.markdown_dir, config.output.site_url, today)
    write_rss(
        config.output.rss_path,
        rss_items,
        title=config.output.site_title,
        site_url=config.output.site_url,
    )
    write_rss(
        daily_rss_path(config.output.daily_rss_dir, today),
        rss_items,
        title=config.output.site_title,
        site_url=config.output.site_url,
    )

    print(
        f"Fetched {len(papers)} papers; wrote {len(written_paths)} new summaries; "
        f"RSS items: {len(rss_items)}; pruned {len(deleted_paths)} old files"
    )


def _sample_papers() -> list[Paper]:
    now = datetime.now(timezone.utc)
    return [
        Paper(
            arxiv_id="9999.00001",
            title="Sample AI Agents Paper",
            authors=["Ada Lovelace", "Alan Turing"],
            arxiv_url="https://arxiv.org/abs/9999.00001",
            pdf_url="https://arxiv.org/pdf/9999.00001",
            published=now,
            abstract=(
                "This sample abstract describes an agent system that uses planning and tool use. "
                "It exists only to verify the local pipeline without network access or an AI key."
            ),
            categories=["cs.AI"],
        )
    ]


if __name__ == "__main__":
    main()
