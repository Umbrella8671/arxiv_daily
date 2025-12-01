import arxiv
from datetime import datetime
import asyncio
from pathlib import Path
from concurrent import futures


months_dict = {
    "1": "January",
    "2": "February",
    "3": "March",
    "4": "April",
    "5": "May",
    "6": "June",
    "7": "July",
    "8": "August",
    "9": "September",
    "10": "October",
    "11": "November",
    "12": "December"
}


class ArxivDaily:
    def __init__(self, domains: list[str], max_results: int = 20) -> None:
        self.domains = domains
        self.max_results = max_results

        self.papers = []

        self.save_dir = Path("arxiv_papers")
        self.save_dir.mkdir(exist_ok=True)
        today_str = datetime.datetime.now().strftime("%Y-%m-%d")
        date_list = today_str.split("-")
        self.daily_dir = self.save_dir / date_list[0] / months_dict[date_list[1]]
        self.daily_dir.mkdir(exist_ok=True)
        self.paper_dir = self.daily_dir / ("paper-" + today_str + ".md")

    def _wrapper_fetch(self, max_results: int):
        search_query = " OR ".join([f"cat:{domain}" for domain in self.domains])

        client = arxiv.Client()
        search = arxiv.Search(
            query=search_query,
            max_results=max_results,             # 每次获取的数量
            sort_by=arxiv.SortCriterion.SubmittedDate, # 按提交时间排序
            sort_order=arxiv.SortOrder.Descending      # 降序（最新的在前面）
        )

        results = client.results(search)

        return list(results)

    async def fetch_recent_papers(self, max_results: int | None = None):
        max_results = max_results or self.max_results
        results = await asyncio.to_thread(self._wrapper_fetch, max_results)

        for result in results:
            paper_info = {
                "title": result.title,
                "authors": [str(author) for author in result.authors],
                "summary": result.summary,
                "primary_category": result.primary_category,
                "categories": result.categories,
                "arxiv_url": result.entry_id,
                "pdf_url": result.pdf_url,
                "published": result.published,
                # "updated": result.updated,
            }
            self.papers.append(paper_info)

    def save_papers(self):
        with open(self.paper_dir, "w", encoding="utf-8") as f:
            f.write(f"# ArXiv Papers for {datetime.now().strftime('%Y-%m-%d')}\n\n")
            for paper in self.papers:
                f.write(f"## {paper['title']}\n")
                f.write(f"- **Authors:** {', '.join(paper['authors'])}\n")
                f.write(f"- **Primary Category:** {paper['primary_category']}\n")
                f.write(f"- **Categories:** {', '.join(paper['categories'])}\n")
                f.write(f"- **ArXiv URL:** [{paper['arxiv_url']}]({paper['arxiv_url']})\n")
                f.write(f"- **PDF URL:** [Link]({paper['pdf_url']})\n\n")
                f.write(f"- **Published:** {paper['published'].strftime('%Y-%m-%d')}\n\n")
                f.write(f"### Summary:\n{paper['summary']}\n\n")
                f.write("---\n\n")

    def run(self):
        asyncio.run(self.fetch_recent_papers())
        self.save_papers()

        
if __name__ == "__main__":
    app = ArxivDaily(domains=["cs.AI", "cs.LG", "cs.CV", "cs.CL"], max_results=20)
    app.run()
