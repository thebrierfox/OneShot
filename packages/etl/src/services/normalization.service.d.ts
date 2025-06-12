import { RawScrapedProduct, NormalizedProduct, VendorConfig } from '@patriot-rentals/shared-types';
/**
 * Normalizes raw scraped product data into a standardized NormalizedProduct object.
 * It applies price parsing and basic data validation.
 *
 * @param rawProduct The raw scraped product data.
 * @param vendorConfig Optional vendor-specific configuration, including rate parsing rules.
 * @returns A NormalizedProduct object.
 */
export declare function normalizeRawProductData(rawProduct: RawScrapedProduct, vendorConfig?: VendorConfig): NormalizedProduct;
export declare const normalize: typeof normalizeRawProductData;
