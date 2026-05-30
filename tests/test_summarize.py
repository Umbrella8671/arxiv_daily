from arxiv_ai_rss.summarize import parse_summary_json


def test_parse_summary_json_accepts_string_list_fields() -> None:
    summary = parse_summary_json(
        """
{
  "research_content": "Research content.",
  "problem_addressed": "Problem addressed.",
  "limitations": "Only evaluated on small datasets.",
  "possible_improvements": "Evaluate on larger benchmarks."
}
"""
    )

    assert summary.limitations == ["Only evaluated on small datasets."]
    assert summary.possible_improvements == ["Evaluate on larger benchmarks."]


def test_parse_summary_json_normalizes_object_list_items() -> None:
    summary = parse_summary_json(
        """
```json
{
  "research_content": "Research content.",
  "problem_addressed": "Problem addressed.",
  "limitations": [{"scope": "limited experiments"}],
  "possible_improvements": [{"direction": "broader evaluation"}]
}
```
"""
    )

    assert summary.limitations == ["scope: limited experiments"]
    assert summary.possible_improvements == ["direction: broader evaluation"]
