from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml


@dataclass(frozen=True)
class InterestConfig:
    name: str
    query: str
    max_results: int = 20


@dataclass(frozen=True)
class AiConfig:
    provider: str
    base_url: str
    model: str
    api_key_env: str = "AI_API_KEY"
    timeout_seconds: float = 180
    max_retries: int = 2


@dataclass(frozen=True)
class OutputConfig:
    site_title: str
    site_url: str
    rss_path: Path
    daily_rss_dir: Path
    markdown_dir: Path
    retention_days: int


@dataclass(frozen=True)
class AppConfig:
    interests: list[InterestConfig]
    ai: AiConfig
    output: OutputConfig


def load_config(path: str | Path) -> AppConfig:
    config_path = Path(path)
    with config_path.open("r", encoding="utf-8") as handle:
        raw = yaml.safe_load(handle) or {}

    interests = [_load_interest(item) for item in raw.get("interests", [])]
    if not interests:
        raise ValueError("config must define at least one interest")

    ai_raw = _require_mapping(raw, "ai")
    output_raw = _require_mapping(raw, "output")

    return AppConfig(
        interests=interests,
        ai=AiConfig(
            provider=str(ai_raw.get("provider", "openai-compatible")),
            base_url=_require_string(ai_raw, "base_url"),
            model=_require_string(ai_raw, "model"),
            api_key_env=str(ai_raw.get("api_key_env", "AI_API_KEY")),
            timeout_seconds=float(ai_raw.get("timeout_seconds", 180)),
            max_retries=int(ai_raw.get("max_retries", 2)),
        ),
        output=OutputConfig(
            site_title=str(output_raw.get("site_title", "arXiv AI Paper Digest")),
            site_url=str(output_raw.get("site_url", "")).rstrip("/"),
            rss_path=Path(_require_string(output_raw, "rss_path")),
            daily_rss_dir=Path(output_raw.get("daily_rss_dir", "output/rss")),
            markdown_dir=Path(_require_string(output_raw, "markdown_dir")),
            retention_days=int(output_raw.get("retention_days", 15)),
        ),
    )


def _load_interest(raw: Any) -> InterestConfig:
    if not isinstance(raw, dict):
        raise ValueError("each interest must be a mapping")
    return InterestConfig(
        name=_require_string(raw, "name"),
        query=_require_string(raw, "query"),
        max_results=int(raw.get("max_results", 20)),
    )


def _require_mapping(raw: dict[str, Any], key: str) -> dict[str, Any]:
    value = raw.get(key)
    if not isinstance(value, dict):
        raise ValueError(f"config must define mapping: {key}")
    return value


def _require_string(raw: dict[str, Any], key: str) -> str:
    value = raw.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"config must define string: {key}")
    return value
