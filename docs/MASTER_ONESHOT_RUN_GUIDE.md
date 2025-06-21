# OneShot – End-to-End Run Guide

This document walks you through running **OneShot** from scratch to a fully-generated price-gap CSV on a single workstation.
It assumes a Windows host (PowerShell examples) but the same commands work on macOS / Linux — just adapt the shell syntax.

> If you only need the TL;DR:
> 1. `docker-compose up -d temporal postgres weaviate`
> 2. `pnpm install`
> 3. **start workers**  
>   `pnpm --filter @patriot-rentals/etl      start`  (ETL)  
>   `pnpm --filter @patriot-rentals/scraper  start`  (Scraper)  
> 4. **kick off a run**  
>   `pnpm --filter @patriot-rentals/orchestrator run:main`
> 5. Watch `packages\etl\etl.log`; when it goes quiet the report is ready in
>    `C:\output\report-<timestamp>.csv`.

---

## 1  Architecture in 30 seconds

```
┌──────────┐    scrapeProductWorkflow   ┌─────────────┐
│ Scraper  │ ─────────────────────────▶ │ Temporal    │
│ worker   │                           │ Server (<1.20)
└──────────┘                           └────┬────────┘
                                            │  etlProcessWorkflow
┌──────────┐   etlProcessActivity          │
│ ETL      │ ◀─────────────────────────────┘
│ worker   │
└──────────┘       writes ↴
               Postgres  &  Weaviate

┌──────────┐   generateCsvReportWorkflow   ┌───────────┐
│ Report    │ ────────────────────────────▶ │ CSV file  │
│ worker    │                              │ (output)  │
└──────────┘                              └───────────┘
```

* Temporal orchestrates the workflows.  
  Your cluster is **< 1.20**, so the older gRPC surface (no `listWorkflowExecutions`) is in use.
* Each npm package is an independent worker or utility:
  * `@patriot-rentals/scraper` – collects product pages.
  * `@patriot-rentals/etl` – cleans/normalises & pushes to DBs.
  * `@patriot-rentals/report` – creates the CSV.
  * `@patriot-rentals/orchestrator` – kicks off and coordinates everything.

---

## 2  Prerequisites

1. **Docker Desktop** (or a local Temporal & Postgres if you already have them).
2. **Node 20 + PNPM 8**  (`corepack enable && corepack prepare pnpm@latest --activate`).
3. **Git** (the repo itself).

> Optional – VS Code, Cursor etc. for a nicer DX.

---

## 3  Clone & install

```powershell
git clone <repo-url>
cd OneShot
pnpm install   # installs every workspace package once
```

---

## 4  Spin up infrastructure

```powershell
# Temporal, Postgres & friends
# adjust services in docker-compose.yml if you need fewer/more
docker-compose up -d temporal postgres weaviate
```

*Temporal UI:* http://localhost:8233  (if you enabled it).

---

## 5  Environment variables

| var | default | notes |
|-----|---------|-------|
| `TEMPORAL_ADDRESS` | `localhost:7233` | gRPC address (all workers) |
| `TEMPORAL_TASK_QUEUE_ETL` | `patriot-etl-tq` | ETL worker queue |
| `TEMPORAL_TASK_QUEUE_SCRAPER` | `scraper-tq` | Scraper queue |
| `TEMPORAL_TASK_QUEUE_MAIN` | `main` | Parent workflow queue |

Set these per-terminal or permanently in your shell profile.

---

## 6  Build (optional)

The workers can run via `ts-node`; for production you can transpile once:

```powershell
pnpm run --filter @patriot-rentals/* build   # builds every package to dist/
```

---

## 7  Start workers

Open three terminals (keep them running):

### 7.1  ETL Worker
```powershell
cd packages\etl
$env:TEMPORAL_ADDRESS       = 'localhost:7233'
$env:TEMPORAL_TASK_QUEUE_ETL = 'patriot-etl-tq'

pnpm start                # alias → node dist/index.js
```
Tails to `packages\etl\etl.log`.

### 7.2  Scraper Worker
```powershell
cd packages\scraper
$env:TEMPORAL_ADDRESS = 'localhost:7233'

pnpm start
```

### 7.3  Report Worker
```powershell
cd packages\report
$env:TEMPORAL_ADDRESS = 'localhost:7233'

pnpm start
```

---

## 8  Kick off a **main** run

In a fourth terminal:

```powershell
cd packages\orchestrator
$env:TEMPORAL_ADDRESS = 'localhost:7233'

# This prints the workflowId so keep the output
npx ts-node src/scripts/start-main.ts
```
Example output
```
Starting main workflow with id oneshot-1750293128061
Workflow started, waiting for result...
Workflow result: C:\output\report-20250618.csv
```

---

## 9  Monitoring

### 9.1  ETL triplet
```powershell
Get-Content ..\etl\etl.log -Wait | Select-String '\[ETL\] (Incoming RawScrapedProduct|Unwrapped product|NormalizedProduct)'
```
You should see **exactly three lines per product**; any error right after a triplet is the bug to fix.

### 9.2  Workflow status (Temporal < 1.20)
Because `listWorkflowExecutions` is missing, use the helper we added:

```powershell
# packages/orchestrator
pnpm run status <workflowId>
# e.g.
pnpm run status oneshot-1750293128061  # → oneshot-… Completed
```

Under the hood this calls `describeWorkflowExecution` via the SDK.

---

## 10  Where is my CSV?

* In `C:\output\report-<timestamp>.csv` (shared path set in the report worker).
* A copy also lands in `packages\report\reports\` for versioning/CI artefacts.

---

## 11  Common issues & fixes

| Symptom | Fix |
|---------|-----|
| `ERR_PNPM_NO_SCRIPT run:main` | Run `pnpm run:main` *inside* `packages\orchestrator`, or call the TS script with `npx ts-node …`. |
| `TypeError: Cannot read properties of undefined (reading 'listWorkflowExecutions')` | Your Temporal server is older than 1.20 – use the `status` helper (section 9.2) instead of the SDK's `list` iterator. |
| No `ETL` log lines | Scraper didn't publish products – make sure a scrape workflow is running, or start a new `main` run. |
| CSV path is empty | Check report worker logs; Postgres / Weaviate must be reachable. |

---

## 12  Next steps

* **CI / CD** – docker-compose overrides + GitHub Actions runner.
* **Upgrade Temporal** – once you jump to ≥ 1.20 you can re-enable the richer status script using `client.list()`.
* **More vendors** – add configs under `packages\scraper\src\configs\` and extend `docs\vendors.md`.

Happy scrapes! 🎉 