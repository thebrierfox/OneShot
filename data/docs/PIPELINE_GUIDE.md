# Pipeline Guide

The **OneShot** pipeline consists of three primary stages: scrape, ETL and report. A Temporal workflow orchestrates these stages for each vendor according to their playbook plan.

1. **Scrape** – For each Patriot SKU, the scraper package uses Playwright (and optionally Stagehand) to fetch competitor pricing. Vendor selectors and custom parsers are defined in `packages/scraper`. When a scraper encounters a blocker (e.g. zip code modals, login, captcha), it throws a `needsAgent` error with a specific code (e.g. `SUNBELT_MODAL`). The runner responds by invoking a Stagehand recipe in `.chatrunner/`.
2. **ETL** – Raw scrape results are cleaned and normalised into a common schema (`NormalizedProduct`) by the ETL package. This stage enriches the data and ensures consistent fields across vendors.
3. **Report** – The report package takes normalised product data and the Patriot catalogue to produce a CSV variance report, which is merged into `playbooks/<vendor>/runs/<timestamp>/5-report.csv` and later aggregated across vendors.

The `scripts/playbook.ts` script glues these stages together for a single vendor, while `scripts/runVendorPlaybook.ts` pulls the latest code, executes the playbook and commits artefacts. Aggregation is handled by `scripts/aggregate.ts`, which merges the latest CSV reports from each vendor into `aggregate/latest-full-variance.csv`.
