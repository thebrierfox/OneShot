# Architecture Overview

```
Customer
   │
   │  pnpm generate-report
   ▼
┌──────────────────────────────────────────────┐
│  CLI / Orchestrator (packages/orchestrator)  │
│  Temporal Workflows                          │
└──────────────────────────────────────────────┘
            │               ▲
            │ triggers      │ results
            ▼               │
┌──────────────────────────────────────────────┐
│  Scraper Workers (packages/scraper)          │
│  • Playwright + vendor configs               │
│  • Stores raw HTML / JSON snapshots          │
└──────────────────────────────────────────────┘
            │ scraped data
            ▼
┌──────────────────────────────────────────────┐
│  ETL Layer (packages/etl)                    │
│  • Cleans & normalises product records       │
│  • Writes to Postgres + Weaviate             │
└──────────────────────────────────────────────┘
            │ normalised data
            ▼
┌──────────────────────────────────────────────┐
│  Analytics (packages/analytics)              │
│  • SKU matching algorithm                    │
│  • Determines competitor price gaps          │
└──────────────────────────────────────────────┘
            │ matched results
            ▼
┌──────────────────────────────────────────────┐
│  Report Generator (packages/report)          │
│  • Markdown & CSV output                     │
└──────────────────────────────────────────────┘
```

## Key Packages & Paths

| Package                       | Path                                      | Responsibility                                  |
|-------------------------------|-------------------------------------------|-------------------------------------------------|
| Scraper                       | `packages/scraper`                        | Headless browser scraping of competitor sites   |
| Crawler                       | `packages/crawler`                        | Discover product URLs from start pages          |
| ETL                           | `packages/etl`                            | Persist raw & cleaned data in Postgres / Weaviate|
| Analytics                     | `packages/analytics`                      | Match SKUs and calculate price gaps             |
| Report                        | `packages/report`                         | Output Markdown / CSV report                    |
| Orchestrator (Temporal)       | `packages/orchestrator`                   | Coordinates multi-step pipeline                 |
| Shared Types                  | `packages/shared-types`                   | TypeScript interfaces shared across packages    |

## Supporting Infrastructure

Docker containers defined in `docker-compose.yml`:

- **Postgres** – primary relational store
- **Weaviate** – vector store for fuzzy SKU matching
- **Redis** – task/state caching
- **Temporal** – workflow engine
- **Browserless** – headless Chromium for Playwright
- **FlareSolverr** – Cloudflare bypass when required

> All services start with `pnpm db:up` (or `docker-compose up -d`) and shut down with `pnpm db:down`.

## Data Flow Summary
1. Orchestrator kicks off Crawler to enumerate product URLs per vendor.
2. Scraper fetches each URL using Playwright, yielding raw product blobs.
3. ETL cleans the data, stores canonical records in Postgres + embeddings in Weaviate.
4. Analytics component matches competitor SKUs to Patriot SKUs and computes price deltas.
5. Report package renders the comparison results into human-readable Markdown/CSV.

## Extensibility
- **New vendor**: add a config file in `packages/scraper/src/configs/`.
- **New output format**: implement additional renderer in `packages/report`.
- **Algorithm tweaks**: update matching logic in `packages/analytics/src/matching/`.

Keeping this high-level map current prevents architectural drift. Significant changes should update this document in the same pull request. 