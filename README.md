# Glenride Bloom Market Research Scraper

Automated ingestion pipeline for curating the freshest market intelligence from a mix of RSS feeds and browser-based sources. Built with Node.js, TypeScript, RSS Parser, and Puppeteer Extra (stealth mode).

## Prerequisites
- Node.js 20+ (includes built-in `fetch`)
- npm 9+

## Setup
```bash
npm install
```

## Run a Live Collection
Compiles the TypeScript sources and executes the CLI to fetch feeds, scrape browser sources, tag items, and print the insight report.
```bash
npm run scrape
```
You can run the TypeScript sources without a build step during iteration:
```bash
npm run scrape:dev
```

## CLI Options
```bash
node dist/cli.js run --help
```
Key flags:
- `--config <path>` – JSON array of custom sources (see `src/config/sources.ts` for schema examples).
- `--storage <path>` – Override local cache file (default `./data/insights-cache.json`).
- `--min-tags <n>` – Require at least _n_ tags per insight (defaults to 1).

## Output
- Terminal report grouped by business tag with deduplicated links.
- Persistent cache at `data/insights-cache.json` retaining last 48 hours for de-duplication.

## Source Configuration
RSS and Puppeteer sources share a common schema (`src/types.ts`). To add or override sources:
1. Copy `src/config/sources.ts` into a JSON file, adjust the objects, and pass via `--config`.
2. Puppeteer entries support CSS selectors and attribute extraction. Stealth mode is enabled to reduce bot detection; adjust `waitForSelector` and `itemSelector` if sites change structure.

## Development Notes
- `npm run dev` starts an auto-reloading watcher via `tsx watch`.
- `npm run lint` ensures the TypeScript project compiles cleanly.
- Tests are not yet implemented; suggested next step is snapshot comparison of tagging output.

## Next Iterations
See `prd.md` for the product roadmap, open questions, and enhancement backlog.
