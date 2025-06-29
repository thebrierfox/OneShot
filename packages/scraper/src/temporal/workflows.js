"use strict";
// @ts-nocheck
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeProductWorkflow = void 0;
const wf = __importStar(require("@temporalio/workflow"));
const crypto_1 = require("crypto");
// Activity A requires a namespace import to be type-safe, so we proxy
// activities directly from the imported namespace.
const { scrapeProductPageActivity } = wf.proxyActivities({
    startToCloseTimeout: process.env.TEMPORAL_ACTIVITY_TIMEOUT_MS || '5 minutes',
    // Other activity options like heartbeats, retries, etc., can be configured here or in activity implementation.
});
/**
 * Workflow to scrape a single product page and then trigger ETL.
 * @param url The URL of the product page to scrape.
 * @param vendorId The vendor ID for configuration lookup.
 * @param forceRescrape Optional flag to force rescraping, potentially used by activity.
 * @returns The raw scraped product data.
 */
async function scrapeProductWorkflow(url, vendorId, forceRescrape // Though not directly used by workflow logic, passed to activity if needed by it
) {
    wf.log.info('Starting scrapeProductWorkflow', { url, vendorId });
    const rawProductData = await scrapeProductPageActivity(url, vendorId);
    if (!rawProductData.error) {
        const etlTaskQueue = process.env.TEMPORAL_TASK_QUEUE_ETL;
        if (!etlTaskQueue) {
            wf.log.error('TEMPORAL_TASK_QUEUE_ETL environment variable is not set. Cannot dispatch ETL task.');
            // Potentially update rawProductData.error or handle this critical failure
            rawProductData.error = 'ETL task queue not configured, processing stopped after scrape.';
        }
        else {
            // Create a more stable workflow ID for ETL based on content or URL hash
            const urlHash = (0, crypto_1.createHash)('md5').update(url).digest('hex').substring(0, 16);
            const etlWorkflowId = `etl-${vendorId}-${urlHash}-${new Date(rawProductData.scrapedAt || Date.now()).toISOString().replace(/[:.]/g, '-')}`;
            wf.log.info(`Scraping successful for ${url}. Triggering ETL workflow: ${etlWorkflowId}`);
            try {
                // Not waiting for the child workflow to complete: fire-and-forget style from scraper's perspective
                // The ETL workflow will handle its own lifecycle.
                await wf.startChildWorkflow('etlProcessWorkflow', {
                    args: [rawProductData], // Pass the entire RawScrapedProduct object
                    taskQueue: etlTaskQueue,
                    workflowId: etlWorkflowId,
                    // Options for child workflow, like timeouts, retries, parentClosePolicy etc.
                    // parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_TERMINATE, // Example
                    // workflowExecutionTimeout: '10m' // Example
                });
                wf.log.info(`ETL child workflow ${etlWorkflowId} started.`);
            }
            catch (childWorkflowError) {
                wf.log.error(`Failed to start ETL child workflow ${etlWorkflowId} for ${url}`, { error: childWorkflowError });
                // Update error status on rawProductData if desired
                rawProductData.error = `Failed to start ETL workflow: ${childWorkflowError instanceof Error ? childWorkflowError.message : String(childWorkflowError)}`;
            }
        }
    }
    else {
        wf.log.warn(`Scraping failed for ${url}, error: ${rawProductData.error}. ETL will not be triggered.`);
    }
    return rawProductData;
}
exports.scrapeProductWorkflow = scrapeProductWorkflow;
//# sourceMappingURL=workflows.js.map