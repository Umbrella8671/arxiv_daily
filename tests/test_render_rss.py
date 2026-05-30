from xml.etree import ElementTree

from arxiv_ai_rss.render_rss import render_rss


def test_render_rss_creates_channel_and_items() -> None:
    xml = render_rss(
        [
            {
                "title": "Paper title",
                "link": "https://example.test/output/papers/1234.00001.md",
                "guid": "https://arxiv.org/abs/1234.00001",
                "description": "Summary text.",
                "published": "2026-01-01",
            }
        ],
        title="Test Digest",
        site_url="https://example.test",
    )

    root = ElementTree.fromstring(xml)
    channel = root.find("channel")
    assert root.tag == "rss"
    assert channel is not None
    assert channel.findtext("title") == "Test Digest"
    item = channel.find("item")
    assert item is not None
    assert item.findtext("title") == "Paper title"
    assert item.findtext("link") == "https://example.test/output/papers/1234.00001.md"
    assert item.findtext("guid") == "https://arxiv.org/abs/1234.00001"
    assert item.findtext("description") == "Summary text."
