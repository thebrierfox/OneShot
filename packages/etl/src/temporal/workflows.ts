import {
  proxyActivities,
  ApplicationFailure,
  log,
} from '@temporalio/workflow';
import type { RawScrapedProduct, VendorConfig, NormalizedProduct } from '@patriot-rentals/shared-types';
import * as activities from './activities'; // Import all exports from activities

const { etlProcessActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minute',
  retry: {
    maximumAttempts: 3,
  },
});

// Lazy import to avoid hard dependency if scraper package not present during some builds
let scraperVendorConfigMap: Record<string, VendorConfig> | undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  scraperVendorConfigMap = require('@patriot-rentals/scraper/dist/configs').vendorConfigMap || undefined;
} catch {
  // scraper package not available – ignore
}

/**
 * Temporal Workflow to manage the ETL processing of a single raw scraped product.
 * This workflow calls the `etlProcessActivity` and handles its outcome.
 *
 * @param rawProduct The raw product data scraped from a vendor website.
 * @param vendorConfig Optional configuration for the vendor, passed to the activity for normalization.
 * @returns A promise resolving to the result of the ETL activity, or throws an ApplicationFailure on error.
 */
export async function etlProcessWorkflow(
  rawProduct: RawScrapedProduct,
  vendorConfig?: VendorConfig,
): Promise<NormalizedProduct> {
  log.info('Starting etlProcessWorkflow', { 
    url: rawProduct.url, 
    vendorId: rawProduct.vendorId, 
    hasVendorConfig: !!vendorConfig 
  });

  try {
    if (!vendorConfig && scraperVendorConfigMap) {
      vendorConfig = scraperVendorConfigMap[rawProduct.vendorId as string];
    }

    const result: any = await etlProcessActivity(rawProduct, vendorConfig);

    log.info('etlProcessWorkflow completed successfully.');
    return result as NormalizedProduct;
  } catch (e: any) {
    if (e instanceof ApplicationFailure) {
      log.error('ETL workflow failed with ApplicationFailure', { name: e.name, message: e.message, type: e.type });
      throw e; // Re-throw ApplicationFailure as is
    }
    log.error('ETL workflow failed with an unexpected error', { error: e });
    throw ApplicationFailure.create({
      message: 'Unexpected error in etlProcessWorkflow',
      type: 'WorkflowError',
      nonRetryable: true,
      cause: e as Error,
    });
  }
}

export const etlWorkflow = etlProcessWorkflow; 