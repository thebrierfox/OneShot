import type { NormalizedProduct } from '@patriot-rentals/shared-types';
/**
 * Generates a vector embedding for a given normalized product.
 * @param product The NormalizedProduct object.
 * @returns A Promise resolving to an array of numbers representing the product embedding.
 */
export declare function generateProductEmbedding(product: NormalizedProduct): Promise<number[]>;
