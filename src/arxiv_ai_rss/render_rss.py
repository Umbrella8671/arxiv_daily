from __future__ import annotations

from datetime import datetime, timezone
from email.utils import format_datetime
from pathlib import Path
from typing import Any, Mapping, Sequence
from xml.etree import ElementTree


def render_rss(items: Sequence[Mapping[str, Any]], *, title: str, site_url: str) -> str:
    rss = ElementTree.Element("rss", {"version": "2.0"})
    channel = ElementTree.SubElement(rss, "channel")
    ElementTree.SubElement(channel, "title").text = title
    ElementTree.SubElement(channel, "link").text = site_url
    ElementTree.SubElement(channel, "description").text = f"{title} generated from arXiv summaries"

    for item in sorted(items, key=lambda value: str(value.get("published", "")), reverse=True):
        node = ElementTree.SubElement(channel, "item")
        ElementTree.SubElement(node, "title").text = str(item["title"])
        ElementTree.SubElement(node, "link").text = str(item["link"])
        ElementTree.SubElement(node, "guid").text = str(item.get("guid", item["link"]))
        ElementTree.SubElement(node, "description").text = str(item.get("description", ""))
        pub_date = _parse_date(item.get("published"))
        if pub_date is not None:
            ElementTree.SubElement(node, "pubDate").text = format_datetime(pub_date)

    ElementTree.indent(rss, space="  ")
    return ElementTree.tostring(rss, encoding="unicode", xml_declaration=True)


def write_rss(path: str | Path, items: Sequence[Mapping[str, Any]], *, title: str, site_url: str) -> None:
    rss_path = Path(path)
    rss_path.parent.mkdir(parents=True, exist_ok=True)
    rss_path.write_text(render_rss(items, title=title, site_url=site_url), encoding="utf-8")


def _parse_date(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        date_value = value
    else:
        date_value = datetime.fromisoformat(str(value))
    if date_value.tzinfo is None:
        date_value = date_value.replace(tzinfo=timezone.utc)
    return date_value
