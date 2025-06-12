# Roadmap

> Version numbers are placeholders—adjust as the project evolves.

## Milestone v0.3 – Minimum Viable Pipeline (MVP)
- [ ] Crawler discovers URLs for at least 2 vendors in config.
- [ ] Scraper extracts product name, SKU, daily rental rate.
- [ ] ETL stores raw and cleaned data in Postgres.
- [ ] CLI command `pnpm generate-report --skip-matching` produces raw data summary.

## Milestone v0.4 – Price-Gap Report
- [ ] Analytics layer matches competitor SKUs to Patriot SKUs (≥ 95 % automated).
- [ ] Report generator outputs Markdown + CSV price-gap tables.
- [ ] End-to-end smoke test passes in CI (`pnpm generate-report --skip-crawling`).

## Milestone v0.5 – Vendor Extensibility
- [ ] Add 2 additional competitor configs as examples.
- [ ] Docs: "How to add a vendor" tutorial.
- [ ] Playwright context configuration per vendor (headers, user-agent, etc.).

## Milestone v1.0 – Production-Ready Local Tool
- [ ] Full CLI flags (`--vendors`, `--force-recrawl-all`, etc.) documented.
- [ ] CI workflow green; code coverage ≥ 80 % on core packages.
- [ ] README badges for build, coverage, npm version.
- [ ] Tagged release `v1.0.0` with changelog.

## Backlog (v2+ ideas)
- Continuous scraping scheduler.
- GUI dashboard.
- AWS/RDS deployment scripts.
- Dynamic price suggestions / optimisation.

> Use GitHub Milestones to track these phases. When all Issues in a milestone close, tag a release (`git tag v0.4`) and merge into `main`. Subsequent work begins on the next milestone. 