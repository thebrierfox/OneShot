import * as wf from '@temporalio/workflow';
import type * as activities from './activities';
import type { RawScrapedProduct } from '@patriot-rentals/shared-types';
import { createHash } from 'crypto';

// Activity A requires a namespace import to be type-safe, so we proxy
// activities directly from the imported namespace.
const activityTimeoutSeconds = process.env.TEMPORAL_ACTIVITY_TIMEOUT_MS
  ? Number(process.env.TEMPORAL_ACTIVITY_TIMEOUT_MS) / 1000
  : 300; // default 5 minutes

const { scrapeProductPageActivity } = wf.proxyActivities<typeof activities>({
  // Temporal TS SDK typing accepts string or Duration; use seconds string to satisfy inference.
  startToCloseTimeout: `${activityTimeoutSeconds}s` as any,
  // Other activity options like heartbeats, retries, etc., can be configured here or in activity implementation.
});

/**
 * Workflow to scrape a single product page and then trigger ETL.
 * @param url The URL of the product page to scrape.
 * @param vendorId The vendor ID for configuration lookup.
 * @param forceRescrape Optional flag to force rescraping, potentially used by activity.
 * @returns The raw scraped product data.
 */
export async function scrapeProductWorkflow(
  url: string, 
  vendorId: string,
  forceRescrape?: boolean // Though not directly used by workflow logic, passed to activity if needed by it
): Promise<RawScrapedProduct> {
  wf.log.info('Starting scrapeProductWorkflow', { url, vendorId });

  const rawProductData = await scrapeProductPageActivity(url, vendorId);

  if (!rawProductData.error) {
    const etlTaskQueue = process.env.TEMPORAL_TASK_QUEUE_ETL;
    if (!etlTaskQueue) {
      wf.log.error('TEMPORAL_TASK_QUEUE_ETL environment variable is not set. Cannot dispatch ETL task.');
      // Potentially update rawProductData.error or handle this critical failure
      rawProductData.error = 'ETL task queue not configured, processing stopped after scrape.';
    } else {
      // Create a more stable workflow ID for ETL based on content or URL hash
      const urlHash = createHash('md5').update(url).digest('hex').substring(0, 16);
      const etlWorkflowId = `etl-${vendorId}-${urlHash}-${new Date(rawProductData.scrapedAt || Date.now()).toISOString().replace(/[:.]/g, '-')}`;
      
      wf.log.info(`Scraping successful for ${url}. Triggering ETL workflow: ${etlWorkflowId}`);
      try {
        // Not waiting for the child workflow to complete: fire-and-forget style from scraper's perspective
        // The ETL workflow will handle its own lifecycle.
        await wf.startChild('etlProcessWorkflow' as any, {
          args: [rawProductData], // Pass the entire RawScrapedProduct object
          taskQueue: etlTaskQueue,
          workflowId: etlWorkflowId,
          // Options for child workflow, like timeouts, retries, parentClosePolicy etc.
          // parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_TERMINATE, // Example
          // workflowExecutionTimeout: '10m' // Example
        });
        wf.log.info(`ETL child workflow ${etlWorkflowId} started.`);
      } catch (childWorkflowError) {
        wf.log.error(`Failed to start ETL child workflow ${etlWorkflowId} for ${url}`, { error: childWorkflowError });
        // Update error status on rawProductData if desired
        rawProductData.error = `Failed to start ETL workflow: ${childWorkflowError instanceof Error ? childWorkflowError.message : String(childWorkflowError)}`;
      }
    }
  } else {
    wf.log.warn(`Scraping failed for ${url}, error: ${rawProductData.error}. ETL will not be triggered.`);
  }

  return rawProductData;
} 