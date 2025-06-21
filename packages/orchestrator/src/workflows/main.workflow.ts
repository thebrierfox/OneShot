import { executeChild } from '@temporalio/workflow';

// We invoke child workflows by name to avoid cross-package value imports which complicate build references.

const SCRAPER_TQ = 'patriot-scraper-tq';
const ETL_TQ = 'patriot-etl-tq';
const REPORT_TQ = 'report';

/**
 * Orchestrates the full pipeline:
 * 1. scrape → 2. etl → 3. report (CSV)
 * @param input arbitrary input understood by the scraper workflow
 */
export async function main(input: unknown): Promise<string> {
  // If caller passes explicit targets, use them; otherwise fall back to a minimal seed.
  const targets = Array.isArray(input) && input.length > 0 ? (input as any[]) : [
    {
      vendor: 'sunbelt',
      sku: '0350110',
      url: 'https://www.sunbeltrentals.com/equipment-rental/earth-moving/2-000-lb-mini-excavator/0350110/'
    },
  ];

  // Step 1 – scrape each target in parallel child workflows
  const rawResults: any[] = [];
  for (const target of targets) {
    // Using `executeChild` sequentially keeps resource usage predictable in the smoke test.
    const raw = await executeChild('scrapeProductWorkflow' as any, {
      args: [target.url, target.vendor],
      taskQueue: SCRAPER_TQ,
    });
    rawResults.push(raw);
  }

  // Step 2 – ETL workflow for each raw result and collect normalized products
  const cleaned: any[] = [];
  for (const raw of rawResults) {
    const normalized = await executeChild('etlProcessWorkflow' as any, {
      args: [raw],
      taskQueue: ETL_TQ,
    });
    cleaned.push(normalized);
  }

  // Step 3 – Report workflow → CSV path
  const csvPath = await executeChild('generateCsvReportWorkflow' as any, {
    args: [cleaned],
    taskQueue: REPORT_TQ,
  });
  return csvPath as string;
} 