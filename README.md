# arxiv_daily

`arxiv_daily` fetches recent arXiv papers for configured research interests, summarizes each new paper with an OpenAI-compatible chat/completions provider, writes one Markdown summary per paper, and generates an RSS feed.

## Setup

Install dependencies with uv:

```bash
uv sync
```

Run tests:

```bash
uv run pytest
```

## Configuration

Research interests live in `config/interests.yaml`. Edit this file to change arXiv queries without touching code:

```yaml
interests:
  - name: llm_agents
    query: 'cat:cs.AI AND (agent OR "tool use" OR planning)'
    max_results: 20
```

The same file controls the AI provider and output locations:

```yaml
ai:
  provider: deepseek
  base_url: https://api.deepseek.com
  model: deepseek-chat

output:
  site_title: arXiv AI Paper Digest
  site_url: https://raw.githubusercontent.com/Umbrella8671/arxiv_daily/refs/heads/main
  rss_path: output/rss.xml
  daily_rss_dir: output/rss
  markdown_dir: output/papers
  retention_days: 15
```

The pipeline reads the API key from the `AI_API_KEY` environment variable. Do not put API keys in the YAML file.

## Local Runs

Run the real pipeline:

```bash
AI_API_KEY=... uv run python scripts/run_pipeline.py
```

Run a local dry run that does not call arXiv or require an AI API key:

```bash
uv run python scripts/run_pipeline.py --dry-run --sample-data
```

Outputs are written to:

- `output/papers/YYYY-MM-DD/*.md`
- `output/rss.xml`, a stable feed URL containing papers newly summarized today
- `output/rss/YYYY-MM-DD.xml`, a daily archive of that day's RSS feed

Use this RSS URL in a reader after generated output has been committed to GitHub:

```text
https://raw.githubusercontent.com/Umbrella8671/arxiv_daily/refs/heads/main/output/rss.xml
```

Existing Markdown summaries are detected by their `arxiv_id` front matter, so already summarized papers are skipped on later runs.
Paper date folders and matching daily RSS archives older than `retention_days` are pruned automatically. The default config keeps the latest 15 days.

## Scheduled GitHub Runs

`.github/workflows/daily_update.yaml` runs daily at `01:00 UTC` and can also be started manually from the GitHub Actions tab.

Before enabling scheduled runs, add this repository secret:

```text
AI_API_KEY
```

The workflow installs Python 3.12 and uv, runs `uv run pytest`, runs the pipeline, and commits changed files under `output/papers`, `output/rss`, and `output/rss.xml` back to the repository.
