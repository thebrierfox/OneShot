# Project Charter: OneShot – Patriot Price-Gap Tool

## Purpose
Provide a locally-runnable tool that scrapes competitor equipment-rental rates, normalises & stores the data, matches competitor SKUs to Patriot's catalogue and outputs a clear price-gap report so Patriot can quickly adjust pricing and stay competitive.

## Success Criteria  ("Done Means")
1. **End-to-End Command** — Running `pnpm generate-report` completes without manual intervention and produces a Markdown (and CSV) price-gap report in the configured output directory.
2. **Configurable Vendors** — Adding or modifying a vendor config inside `packages/scraper/src/configs/` is the *only* action required to support a new competitor.
3. **Reliable Data Store** — Scraped data is persisted in Postgres / Weaviate via the ETL layer and can be re-used across runs.
4. **Accurate Matching** — The analytics layer maps ≥ 95 % of scraped competitor SKUs to Patriot SKUs in automated tests.
5. **Repeatable & Containerised** — All supporting services (Postgres, Temporal, Browserless, FlareSolverr, Redis) spin up via `pnpm db:up` or `docker-compose up -d`.
6. **CI Green** — `pnpm lint`, `pnpm typecheck`, `pnpm test` pass on every commit to `main`.

## Non-Goals  (Out of Scope for v1)
- A hosted SaaS interface or web UI.
- Real-time or continuous scraping; runs are manual/on-demand.
- Pricing optimisation algorithms beyond basic price-gap calculation.
- Automated bypassing of paywalls or TOS-violating scraping.
- Multi-tenant user management.

Changes to this charter require explicit agreement and a versioned commit. 