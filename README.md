# OneShot Monorepo Skeleton

This repository follows the monorepo structure defined in the **Master Directive**. It uses pnpm workspaces and organizes code, data, playbooks, and scripts into separate rings for maintainability. See `MASTER_DIRECTIVE.md` for full details on how to use and extend this pipeline.

Directories:

- `libs/` – shared TypeScript utilities.
- `packages/` – scrapers, ETL, analytics, orchestrator, report generators, and common/shared types.
- `data/` – static inputs and templates (Patriot catalog, multipliers, report templates).
- `playbooks/` – vendor-specific strategies and run artefacts.
- `aggregate/` – merged output reports.
- `.chatrunner/` – Stagehand YAML recipes for agent interactions.
- `scripts/` – automation scripts for running playbooks, aggregation, and scheduling.

This skeleton provides placeholders (via `.gitkeep` files) for the above directories so they can be versioned even while empty.
