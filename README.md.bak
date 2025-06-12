# Patriot Equipment Rentals – Competitor Price-Gap Tool

A locally-executable, open-source tool to scrape competitor rental rates, match them against Patriot's catalog, and generate a price gap analysis report.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Running Docker Services](#running-docker-services)
- [Generating a Report (Primary Use Case)](#generating-a-report-primary-use-case)
- [Development](#development)
  - [Running Individual Packages](#running-individual-packages)
  - [Linting, Formatting, Type Checking](#linting-formatting-type-checking)
  - [Running Tests](#running-tests)
- [Configuring Competitors](#configuring-competitors)
  - [Vendor Configuration Files](#vendor-configuration-files)
  - [Finding Selectors](#finding-selectors)
  - [Testing Individual URL Scrapes](#testing-individual-url-scrapes)
- [Troubleshooting](#troubleshooting)
- [Key Considerations for Operator](#key-considerations-for-operator)

## Prerequisites

- [Node.js](https://nodejs.org/) (v18.17.0 or as specified in `.nvmrc`)
- [pnpm](https://pnpm.io/) (v8.6.0 or as specified in `package.json` engines)
- [Docker](https://www.docker.com/get-started/) & Docker Compose
- Git

## Initial Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd patriot-price-gap-tool
    ```
2.  **Install Node.js version (optional, if using nvm):**
    ```bash
    nvm use
    ```
3.  **Copy environment file:**
    ```bash
    cp .env.example .env
    ```
    Review `.env` and update any necessary variables (e.g., ports if defaults conflict, `VENDOR_IDS_TO_PROCESS`).

4.  **Install dependencies:**
    ```bash
    pnpm install --frozen-lockfile
    ```

## Running Docker Services

All backend services (Postgres, Weaviate, Redis, Temporal, Browserless, FlareSolverr) run in Docker.

-   **Start all services (detached mode):**
    ```bash
    pnpm db:up
    # or: docker-compose up -d
    ```
-   **View logs:**
    ```bash
    pnpm db:logs
    # or: docker-compose logs -f
    ```
-   **Stop all services and remove volumes (for a clean start):**
    ```bash
    pnpm db:down
    # or: docker-compose down --volumes
    ```

Ensure all services are healthy before proceeding to generate a report.

## Generating a Report (Primary Use Case)

This is the main command to run the entire pipeline:

```bash
pnpm generate-report
```

**Optional flags:**

-   `--vendors <ids>`: Comma-separated list of vendor IDs to process (e.g., `sunbelt,unitedrentals`). Overrides `.env` and `config/initial_competitors_to_process.json`.
-   `--force-recrawl-all`: Force re-crawling and re-scraping of all target URLs.
-   `--force-rescrape-found`: Force re-scraping of URLs found by crawler, even if recently scraped.
-   `--skip-crawling`: Skip crawling, re-process existing data.
-   `--skip-matching`: Skip the SKU matching phase.

Example:
`pnpm generate-report --vendors sunbelt --force-recrawl-all`

The generated Markdown report will be saved in the `./reports` directory (configurable via `REPORTS_OUTPUT_DIR` in `.env`).

## Development

### Running Individual Packages

To run a development server for a specific package (e.g., with hot-reloading if configured):

```bash
pnpm --filter <packageName> dev
# Example: pnpm --filter @patriot-rentals/scraper dev
```

### Linting, Formatting, Type Checking

-   **Lint:** `pnpm lint` (will also auto-fix where possible)
-   **Format:** `pnpm format`
-   **Type Check:** `pnpm typecheck`

### Running Tests

-   **Run all tests across workspace:** `pnpm test`
-   **Run tests for a specific package:** `pnpm --filter <packageName> test`

## Configuring Competitors

Competitor-specific scraping logic is defined in configuration files.

### Vendor Configuration Files

-   Location: `packages/scraper/src/configs/`
-   Naming: `[vendorId].config.ts` (e.g., `sunbelt.config.ts`). The `vendorId` (e.g., `sunbelt`) is used to reference the competitor.
-   Structure: Each file exports a `VendorConfig` object (see `packages/shared-types/src/index.ts`).
-   Key fields to configure:
    -   `id`, `displayName`, `baseUrl`, `startUrls`
    -   `productUrlDetectRegex`: Regular expression to identify product pages.
    -   `selectors`: CSS selectors for extracting data (product name, prices, SKU, etc.).
    -   `networkIntercepts` (optional): For sites loading price data via XHR/fetch.
    -   `customParser` (optional): For complex data transformations.
    -   `playwrightContextOptions`: To set user-agent, viewport, etc.
    -   `useFlaresolverr`: Set to `true` for sites protected by Cloudflare.

### Finding Selectors

Use your browser's Developer Tools (Inspector) to find appropriate CSS selectors for the data points you want to extract.

### Testing Individual URL Scrapes

To test the scraping logic for a single URL of a configured vendor:

```bash
pnpm test:e2e:scrape-url --vendorId <id> --url <product_page_url>
# Example: pnpm test:e2e:scrape-url --vendorId sunbelt --url https://www.sunbeltrentals.com/equipment/some-product/12345/
```

This will attempt to scrape the URL using the specified vendor's config and output the extracted data or errors. Debug snapshots (HTML, screenshot) will be saved to `./debug_snapshots` on failure.

## Troubleshooting

-   **Docker services not starting:** Check `pnpm db:logs` for errors. Ensure ports are not conflicting.
-   **Scrapers failing:** Websites change! Selectors in `*.config.ts` files are the most common point of failure. Use `pnpm test:e2e:scrape-url` to debug. Check saved HTML snapshots.
-   **Temporal Worker issues:** Check logs from the scraper/ETL worker. Ensure Temporal server is healthy.
-   **Type errors after pulling changes:** Run `pnpm install` and `pnpm build`.

## Key Considerations for Operator

-   **Scraper Fragility & Maintenance:** Essential. Expect to update selectors regularly.
-   **Ethical Scraping:** Be respectful. Infrequent, on-demand local runs minimize impact.
-   **Performance:** Depends on your machine and network.
-   **Initial Setup Effort:** Configuring new vendors requires time and web scraping knowledge.
-   **Proxy Use:** For major sites, direct connections might be blocked. Consider `HTTP_PROXY_STRING` in `.env` if needed.
-   **Data Storage:** Docker volumes will grow. Manage disk space accordingly. 