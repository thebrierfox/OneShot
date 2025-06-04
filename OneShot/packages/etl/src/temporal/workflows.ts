import {
  proxyActivities,
  ApplicationFailure,
  log,
  condition,
  setHandler,
  Trigger,
} from '@temporalio/workflow';
import type { RawScrapedProduct, VendorConfig } from '@patriot-rentals/shared-types';
import * as activities from './activities'; // Import all exports from activities

const { etlProcessActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
  // Default retry policy: initialInterval: 1s, an unlimited number of attempts with a 2x backoff coefficient, and a maximumInterval of 100 * initialInterval.
  // Consider customizing if specific retry behavior is needed for ETL.
});

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
): Promise<activities.EtlProcessActivityResult> {
  log.info('Starting etlProcessWorkflow', { 
    url: rawProduct.url, 
    vendorId: rawProduct.vendorId, 
    hasVendorConfig: !!vendorConfig 
  });

  // Simple cancellation signal handling
  const cancelled = new Trigger<boolean>();
  setHandler(condition.defaultSignalHandler, () => {
    log.warn('etlProcessWorkflow received cancellation signal');
    cancelled.resolve(true);
  });

  try {
    // Race activity against cancellation
    const result = await Promise.race([
      etlProcessActivity(rawProduct, vendorConfig),
      cancelled.then(() => {
        throw ApplicationFailure.create({
          message: 'ETL workflow cancelled',
          type: 'WorkflowCancelled',
          nonRetryable: true,
        });
      }),
    ]);

    if (!result.success) {
      log.error('etlProcessActivity reported failure.', { error: result.error, productId: result.productId });
      throw ApplicationFailure.create({
        message: result.error || 'ETL activity failed without specific error message',
        type: 'EtlActivityFailure',
        nonRetryable: true, // Depending on error type, some ETL failures might be retryable with different logic
        details: [result],
      });
    }

    log.info('etlProcessWorkflow completed successfully.', { productId: result.productId, message: result.message });
    return result;
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