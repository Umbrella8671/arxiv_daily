from __future__ import annotations

from dataclasses import dataclass
import json
import os
import re
import time
from typing import Any

import httpx

from arxiv_ai_rss.config import AiConfig
from arxiv_ai_rss.fetch_arxiv import Paper


@dataclass(frozen=True)
class SummaryResult:
    research_content: str
    problem_addressed: str
    limitations: list[str]
    possible_improvements: list[str]


def summarize_paper(paper: Paper, ai: AiConfig, *, dry_run: bool = False) -> SummaryResult:
    if dry_run:
        return SummaryResult(
            research_content=f"Dry-run summary based on the title and abstract for: {paper.title}",
            problem_addressed=paper.abstract[:500],
            limitations=["Dry-run mode did not call an AI provider."],
            possible_improvements=["Run without --dry-run and provide AI_API_KEY for a model-generated summary."],
        )

    api_key = os.environ.get(ai.api_key_env)
    if not api_key:
        raise RuntimeError(f"{ai.api_key_env} is required unless --dry-run is used")

    response = _post_chat_completion(paper, ai, api_key)
    response.raise_for_status()
    content = response.json()["choices"][0]["message"]["content"]
    return parse_summary_json(content)


def _post_chat_completion(paper: Paper, ai: AiConfig, api_key: str) -> httpx.Response:
    last_error: httpx.TimeoutException | None = None
    for attempt in range(ai.max_retries + 1):
        try:
            return httpx.post(
                f"{ai.base_url.rstrip('/')}/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": ai.model,
                    "temperature": 0.2,
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "Return only valid JSON. Summarize only from the title and abstract. "
                                "Do not infer details that are not supported by that text."
                            ),
                        },
                        {
                            "role": "user",
                            "content": _summary_prompt(paper),
                        },
                    ],
                },
                timeout=ai.timeout_seconds,
            )
        except httpx.TimeoutException as exc:
            last_error = exc
            if attempt >= ai.max_retries:
                break
            time.sleep(2**attempt)

    raise RuntimeError(
        f"AI request timed out after {ai.max_retries + 1} attempts "
        f"with timeout_seconds={ai.timeout_seconds}. "
        "Increase ai.timeout_seconds, lower max_results, or try a faster model."
    ) from last_error


def parse_summary_json(content: str) -> SummaryResult:
    match = re.search(r"```(?:json)?\s*(.*?)```", content, flags=re.DOTALL)
    json_text = match.group(1) if match else content
    raw = json.loads(json_text)
    return SummaryResult(
        research_content=_require_string(raw, "research_content"),
        problem_addressed=_require_string(raw, "problem_addressed"),
        limitations=_string_list(raw, "limitations"),
        possible_improvements=_string_list(raw, "possible_improvements"),
    )


def _summary_prompt(paper: Paper) -> str:
    return (
        "Summarize this arXiv paper as JSON with exactly this schema:\n"
        "{\n"
        '  "research_content": "string",\n'
        '  "problem_addressed": "string",\n'
        '  "limitations": ["string"],\n'
        '  "possible_improvements": ["string"]\n'
        "}\n\n"
        f"Title: {paper.title}\n\n"
        f"Abstract: {paper.abstract}"
    )


def _require_string(raw: dict[str, Any], key: str) -> str:
    value = raw.get(key)
    if not isinstance(value, str):
        if value is None:
            raise ValueError(f"AI response field must be a string: {key}")
        return _stringify(value)
    return value.strip()


def _string_list(raw: dict[str, Any], key: str) -> list[str]:
    value = raw.get(key)
    if value is None:
        return []
    if isinstance(value, str):
        value = value.strip()
        return [value] if value else []
    if isinstance(value, list):
        return [_stringify(item) for item in value if _stringify(item)]
    return [_stringify(value)]


def _stringify(value: Any) -> str:
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, dict):
        return "; ".join(f"{key}: {_stringify(item)}" for key, item in value.items()).strip()
    return str(value).strip()
