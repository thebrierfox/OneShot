import { executeChild } from '@temporalio/workflow';

// We invoke child workflows by name to avoid cross-package value imports which complicate build references.

/**
 * Orchestrates the full pipeline:
 * 1. scrape → 2. etl → 3. report (CSV)
 * @param input arbitrary input understood by the scraper workflow
 */
export async function main(input: unknown): Promise<string> {
  // Step 1 – run scraper workflow
  const raw = await executeChild('scrapeProductWorkflow' as any, {
    args: [input],
  });

  // Step 2 – ETL workflow
  const cleaned = await executeChild('etlProcessWorkflow' as any, {
    args: [raw],
  });

  // Step 3 – Report workflow → CSV path
  const csvPath = await executeChild('generateCsvReportWorkflow' as any, {
    args: [cleaned],
  });
  return csvPath as string;
} 