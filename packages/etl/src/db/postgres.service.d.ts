import type { NormalizedProduct } from '@patriot-rentals/shared-types';
/**
 * Saves a normalized product to the database.
 * Performs an UPSERT operation based on the unique constraint (vendor_id, url).
 * @param product The NormalizedProduct object to save.
 * @returns The saved product object, including the database-generated ID.
 * @throws Error if the database operation fails.
 */
export declare function saveNormalizedProduct(product: NormalizedProduct): Promise<NormalizedProduct>;
/**
 * Retrieves a normalized product by its URL and vendor ID.
 * @param url The URL of the product.
 * @param vendorId The vendor ID of the product.
 * @returns A Promise resolving to the NormalizedProduct object or null if not found.
 */
export declare function getProductByUrlAndVendor(url: string, vendorId: string): Promise<NormalizedProduct | null>;
/**
 * Updates the Patriot SKU match for a given product ID.
 * @param productId The ID of the product in the normalized_products table.
 * @param patriotSku The Patriot SKU to match.
 * @returns A Promise resolving when the update is complete.
 */
export declare function updateProductMatch(productId: number, patriotSku: string): Promise<void>;
/**
 * Closes the PostgreSQL connection pool.
 * Intended for graceful shutdown.
 */
export declare function closePgPool(): Promise<void>;
