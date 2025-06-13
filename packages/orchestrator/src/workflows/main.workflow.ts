import { executeChild } from '@temporalio/workflow';
import { loadTargets } from '../targets';

// We invoke child workflows by name to avoid cross-package value imports which complicate build references.

/**
 * Orchestrates the full pipeline:
 * 1. scrape → 2. etl → 3. report (CSV)
 * @param input arbitrary input understood by the scraper workflow
 */
export async function main(input: unknown): Promise<string> {
  // If caller passes explicit targets, honour them; otherwise load default config
  const targets = Array.isArray(input) && input.length > 0 ? (input as any[]) : loadTargets();

  // Step 1 – scrape each target in parallel child workflows
  const rawResults: any[] = [];
  for (const target of targets) {
    // Using `executeChild` sequentially keeps resource usage predictable in the smoke test.
    const raw = await executeChild('scrapeProductWorkflow' as any, {
      args: [target],
    });
    rawResults.push(raw);
  }

  // Step 2 – ETL workflow (batch)
  const cleaned = await executeChild('etlProcessWorkflow' as any, {
    args: [rawResults],
  });

  // Step 3 – Report workflow → CSV path
  const csvPath = await executeChild('generateCsvReportWorkflow' as any, {
    args: [cleaned],
  });
  return csvPath as string;
} 