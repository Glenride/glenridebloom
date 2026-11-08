# Market Research Scraper PRD

## 1. Problem Statement
Market analysts at Glenride Bloom need a continuous stream of fresh insights about emerging companies, funding rounds, strategic partnerships, and topical market shifts. Existing manual workflows depend on visiting numerous newsrooms, newsletters, and company blogs, leading to delays and missed opportunities. We need an automated scraper that consolidates the latest stories into a structured feed.

## 2. Goals & Success Metrics
- **G1 – Freshness:** Collect new articles or posts within 30 minutes of publication from prioritized sources.
- **G2 – Relevancy:** Filter and enrich items to highlight business signals (e.g., funding, launches, partnerships) with >80% precision during pilot.
- **G3 – Analyst Productivity:** Reduce manual sourcing time by 50% through consolidated daily briefings.
- **KPIs:** time-to-ingest, number of unique actionable insights per day, false-positive rate.

## 3. Target Users
- Market research analysts preparing daily briefings.
- Strategy team members monitoring competitor movements.
- Sales enablement staff curating prospect intelligence.

## 4. Scope & Out-of-Scope
- **In scope**
  - Polling RSS/Atom feeds from tech/business news sites and company blogs.
  - Browser-based scraping with Puppeteer for sites without usable feeds.
  - Basic NLP tagging (e.g., detect keywords: funding, acquisition, launch).
  - JSON export and CLI summary report.
- **Out of scope (initial release)**
  - Persisting to production databases.
  - Complex ML summarization or sentiment scoring.
  - Alerting via email/Slack.

## 5. Primary Data Sources
1. RSS/Atom feeds (Crunchbase News, TechCrunch, VentureBeat, etc.).
2. Company press pages that require client-side rendering (scraped via Puppeteer).
3. Optional: LinkedIn company updates exposed via public RSS proxies (if available).

## 6. Functional Requirements
1. **Feed Fetcher**: Configurable list of RSS/Atom URLs; deduplicate by link/guid; store publish timestamp.
2. **Puppeteer Scraper**: Headless Chrome runner with configurable site scripts (selectors, pagination).
3. **Normalizer**: Convert raw items to common schema `{source, title, url, published_at, summary, tags}`.
4. **Tagging/Filtering**: Keyword-based tagging; filter to retain items with business relevance.
5. **Data Store**: Lightweight (JSON/SQLite) storage for recent runs; prevent duplicates within 48 hours.
6. **CLI Output**: `node cli.js run` command to fetch, scrape, tag, and print top insights grouped by tag/source.
7. **Scheduling Support**: Provide instructions for cron invocation (not automated scheduler).

## 7. Non-Functional Requirements
- Modular architecture to swap sources.
- Resilient to transient network failures (retry + exponential backoff).
- Log progress and failures with structured logs.
- Headless execution compatible with server environments.

## 8. Iteration & Milestones
1. **Milestone A – Foundation**
   - Build project skeleton, configuration, and RSS fetch pipeline.
   - Store and display items without enrichment.
2. **Milestone B – Browser Scraping**
   - Add Puppeteer scraper with one reference site implementation.
   - Introduce shared schema + storage.
3. **Milestone C – Insight Layer**
   - Implement tagging/filtering, CLI reporting, and final polish.

## 9. Risks & Mitigations
- **Site Blocking:** Mitigate with polite crawling (User-Agent, rate limits).
- **Dynamic Content Changes:** Keep site scrapers loosely coupled; document selectors.
- **Data Volume:** Implement pagination limits and top-N result output.
- **Maintenance Load:** Provide config-driven approach to add/remove sources easily.

## 10. Open Questions
- Which paid/enterprise data sources may require auth in future iterations?
- Do analysts prefer raw article links or summarized copy-down?
- Should we output CSV in addition to JSON for spreadsheet workflows?

## 11. Iteration Progress (2025-10-26)
- Node.js/TypeScript CLI `npm run scrape` orchestrates RSS ingestion (TechCrunch, VentureBeat, Crunchbase News) and a Puppeteer + stealth scraping pass against Crunchbase News.
- Normalized insights are deduplicated into `data/insights-cache.json`, tagged via keyword heuristics, and reported by tag within the terminal.
- Configurable via JSON, with support for alternative storage path, minimum tag threshold, and custom source definitions.
- Basic resilience: concurrency controls (`p-limit`), polite scraping headers, Puppeteer retries default handled via wait logic.

## 12. Upcoming Enhancements
- Add NLP summarization/embedding scoring to improve relevance weighting beyond keyword tags.
- Persist to SQLite or vector store for richer querying and historical analytics.
- Introduce Slack/email webhook publisher for daily briefings.
- Expand Puppeteer library with templated extractors and screenshot/debug logging for site maintenance.
