from pathlib import Path

from arxiv_ai_rss.config import load_config


def test_load_config_reads_interests_ai_and_output(tmp_path: Path) -> None:
    config_path = tmp_path / "interests.yaml"
    config_path.write_text(
        """
interests:
  - name: agents
    query: 'cat:cs.AI AND agent'
    max_results: 7
ai:
  provider: deepseek
  base_url: https://api.deepseek.com
  model: deepseek-chat
  timeout_seconds: 240
  max_retries: 3
output:
  site_title: Test Digest
  site_url: https://example.test/
  rss_path: output/rss.xml
  markdown_dir: output/papers
""",
        encoding="utf-8",
    )

    config = load_config(config_path)

    assert config.interests[0].name == "agents"
    assert config.interests[0].query == "cat:cs.AI AND agent"
    assert config.interests[0].max_results == 7
    assert config.ai.provider == "deepseek"
    assert config.ai.base_url == "https://api.deepseek.com"
    assert config.ai.model == "deepseek-chat"
    assert config.ai.api_key_env == "AI_API_KEY"
    assert config.ai.timeout_seconds == 240
    assert config.ai.max_retries == 3
    assert config.output.site_title == "Test Digest"
    assert config.output.site_url == "https://example.test"
    assert config.output.rss_path == Path("output/rss.xml")
    assert config.output.daily_rss_dir == Path("output/rss")
    assert config.output.markdown_dir == Path("output/papers")
    assert config.output.retention_days == 15
