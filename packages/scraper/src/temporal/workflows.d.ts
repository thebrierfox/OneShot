import type { RawScrapedProduct } from '@patriot-rentals/shared-types';
/**
 * Workflow to scrape a single product page and then trigger ETL.
 * @param url The URL of the product page to scrape.
 * @param vendorId The vendor ID for configuration lookup.
 * @param forceRescrape Optional flag to force rescraping, potentially used by activity.
 * @returns The raw scraped product data.
 */
export declare function scrapeProductWorkflow(url: string, vendorId: string, forceRescrape?: boolean): Promise<RawScrapedProduct>;
