import type { RawScrapedProduct, VendorConfig, NormalizedProduct } from '@patriot-rentals/shared-types';
/**
 * Main ETL activity. Orchestrates normalization, embedding, and loading of data.
 * @param rawProduct The raw scraped product data.
 * @param vendorConfig The configuration for the vendor.
 * @returns The fully processed and saved NormalizedProduct.
 */
export declare function etlProcessActivity(rawProduct: RawScrapedProduct, vendorConfig?: VendorConfig): Promise<NormalizedProduct>;
