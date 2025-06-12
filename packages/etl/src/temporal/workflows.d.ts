import type { RawScrapedProduct, VendorConfig, NormalizedProduct } from '@patriot-rentals/shared-types';
/**
 * Temporal Workflow to manage the ETL processing of a single raw scraped product.
 * This workflow calls the `etlProcessActivity` and handles its outcome.
 *
 * @param rawProduct The raw product data scraped from a vendor website.
 * @param vendorConfig Optional configuration for the vendor, passed to the activity for normalization.
 * @returns A promise resolving to the result of the ETL activity, or throws an ApplicationFailure on error.
 */
export declare function etlProcessWorkflow(rawProduct: RawScrapedProduct, vendorConfig?: VendorConfig): Promise<NormalizedProduct>;
export declare const etlWorkflow: typeof etlProcessWorkflow;
