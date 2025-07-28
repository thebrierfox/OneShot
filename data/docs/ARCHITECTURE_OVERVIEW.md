# OneShot Architecture Overview

This document provides a high‑level overview of the **OneShot** system architecture as defined in the Master Directive. The repository is organised into four concentric “rings” that separate concerns:

1. **Code Ring** – located under `packages/` and `libs/`. This contains all TypeScript packages such as scrapers, ETL, analytics, orchestrator workflows, reporting and shared types or helpers.
2. **Data Ring** – located under `data/`. Static inputs such as Patriot catalogues, SKU maps, pricing multipliers, Handlebars templates and documentation live here. No secrets or dynamic artefacts should be stored here.
3. **Playbook Ring** – located under `playbooks/`. Each competitor has its own folder containing a living strategy (`README.md`), a run plan (`plan.md`) and a `runs/` subfolder of timestamped artefacts (context, raw scrape, ETL output, Stagehand artefacts, agent notes and final report).
4. **Automation Ring** – located under `scripts/` and `.chatrunner/`. This contains helper scripts that glue together scraping, ETL and reporting using Temporal workflows, git utilities and scheduling (cron or Task Scheduler). The `.chatrunner` directory holds Stagehand YAML recipes that instruct the agent to resolve website blockers.

Each ring has a clear ownership boundary, enabling independent development, testing and deployment while ensuring the full pipeline works when assembled end‑to‑end.