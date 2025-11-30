# arxiv_daily

简洁的 arXiv 每日摘要/抓取工具（项目模板）

## 简介
arxiv_daily 用于定期从 arXiv 抓取感兴趣主题的论文并生成每日摘要，可通过命令行、定时任务或邮件/推送集成分发结果。

## 功能
- 根据关键词/分类抓取最新论文
- 生成可读的摘要/报告（Markdown/HTML）
- 支持配置筛选（作者、日期、关键词）
- 可选：通过邮件或第三方接口发送摘要
- 支持定时运行（cron / systemd / Docker）

## 快速开始
1. 克隆仓库并进入目录
    ```bash
    git clone <repo-url> && cd arxiv_daily
    ```
2. 创建虚拟环境并安装依赖
    ```bash
    python -m venv .venv
    source .venv/bin/activate
    pip install .
    ```
3. 配置（见下节），运行抓取
    ```bash
    python -m arxiv_daily.main
    ```
