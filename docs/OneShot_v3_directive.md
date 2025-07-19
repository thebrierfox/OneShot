# OneShot v3 – Competitive Price Intelligence Directive (Minimal Dependency)

## 1. Purpose & Context
**Client**: Patriot Equipment Rentals (PER)

**Objective**: Produce daily (or on-demand) price variance reports comparing PER’s inventory to competitor rental rates within a 100‑mile radius. Reports must highlight discrepancies (≥ 15 %) and wait for human approval before emailing.

**Constraints**:
- **No live scraping inside the agent**: all heavy scraping must run in an external micro‑service or rely on static price documents stored in Google Drive.
- **Pre‑loaded inventory**: PER’s `patriot_catalog.csv` is stored on Google Drive and treated as the canonical inventory list.
- **Competitor data sources**:
  - **Static price sheets** uploaded to Drive (e.g. Sunbelt’s “Non‑Contract Equipment List” PDF).
  - **Scraper API** endpoints for dynamic sites (e.g. United Rentals), hosted on a small VPS.
- **Manual approval**: report is emailed only after user confirmation.

## 2. Data Sources
| Source | Description | Access method |
|-------|-------------|---------------|
| **PER inventory** | `patriot_catalog.csv` listing SKU, name, group and daily/weekly/monthly rates | Download via Google Drive connector at runtime |
| **Sunbelt price sheet** | PDF or extracted JSON from Sunbelt’s public price list; contains daily rates by equipment code and description | Download via Drive; parse with Python |
| **Scraper API** | REST service for dynamic competitors (e.g. United Rentals) returning JSON `{sku, competitor, price_day, url, scrape_status}` | HTTP POST using provided API key |

## 3. Pre‑flight Checks
1. Verify connectivity to the Scraper API via a `/health` endpoint. Abort if unreachable.
2. Download `patriot_catalog.csv` from Google Drive and load into a dataframe.
3. For each static competitor price sheet needed, download the PDF/CSV from Drive and parse into a dataframe.
4. Ensure that all required API keys (Scraper API, email service) are present in environment variables.

## 4. Workflow Steps
1. **Load PER inventory**
   - Read `patriot_catalog.csv` into a table with columns: `sku`, `name`, `group`, `price_day` (float), `price_week`, `price_month`.

2. **Retrieve competitor prices**
   - For each competitor in scope:
     - **Static source (e.g. Sunbelt)**: parse its price sheet. Map competitor descriptions to PER items using fuzzy matching on equipment type and approximate height or capacity. Extract `competitor_price_day`.
     - **Scraper API**: send a POST with body `{zip:63901, radius:100, skus:[list of PER skus], start_date,timespan}`. Receive a list of `{sku, competitor_price, url, scrape_status}`.

3. **Compute deltas**
   - Join PER inventory and competitor prices on SKU (or fuzzy‑matched key). For each match, compute:
     - `diff_abs = competitor_price - patriot_price`
     - `diff_pct = diff_abs / patriot_price * 100`
     - `alert_flag = |diff_pct| ≥ 15`
   - Build two datasets:
     - `raw_prices.json` with fields `{date, sku, patriot_price, competitor, competitor_price, url, scrape_status}`
     - `price_delta.json` with computed differences and `alert_flag`
   - Create `report.csv` summarising the top variances.

4. **Output & approval**
   - Write the three artefacts to the workspace (or upload to Drive if upload functionality is available).
   - Present a summary of flagged items in chat (e.g. table of top 10 highest positive and negative gaps).
   - Await user approval. Only after receiving `Yes, send` should the agent send an email containing a link to the report in Drive and attach the PDF/CSV.

5. **Notification**
   - On approval, send a single email to `kyle@intuitek.ai` with subject `PER Daily Price Variance Report – {date}` and attach the report. Use the designated email service (e.g. SendGrid) and include a link to the Drive folder containing the artefacts.

## 5. Error Handling & Logging
- If a competitor price is missing, set `scrape_status=not_found` and proceed.
- If the Scraper API returns an error or times out twice, mark that competitor as `scrape_status=timeout`.
- Log all requests and responses to `logs/{date}.log` for auditing.

## 6. Extensibility
- To add a new competitor with a static price list, upload its PDF/CSV to Drive and update the mapping rules in the agent’s price‑parsing function.
- For dynamic competitors, extend the external Scraper API to include them and pass the additional competitor name in the POST request.
- To support regional variations, allow the ZIP code and radius to be parameterised.

## 7. Manual Steps
Until uploads to Google Drive are automated via API, the following tasks should be performed manually:
- Upload `patriot_catalog.csv` and all competitor price sheets to a designated Drive folder.
- Deploy and maintain the external Scraper API (e.g. Node/Playwright container) with appropriate credentials and captchas solving.
- Update the mapping logic for new equipment categories as needed.
