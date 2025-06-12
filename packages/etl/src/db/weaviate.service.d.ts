import { WeaviateClient } from 'weaviate-ts-client';
import type { NormalizedProduct } from '@patriot-rentals/shared-types';
/**
 * Initializes and returns a singleton Weaviate client.
 * @returns The WeaviateClient instance.
 * @throws Error if Weaviate environment variables are not set.
 */
export declare function getWeaviateClient(): WeaviateClient;
/**
 * Ensures the ProductVectors class schema exists in Weaviate.
 * @param client The WeaviateClient instance.
 * @throws Error if schema creation fails.
 */
export declare function ensureProductSchemaExists(client: WeaviateClient): Promise<void>;
/**
 * Upserts a product vector and its associated metadata to Weaviate.
 * This function implements an explicit query-then-write upsert logic.
 * @param client The WeaviateClient instance.
 * @param product The NormalizedProduct object.
 * @param vector The embedding vector for the product.
 * @returns The Weaviate ID of the upserted object.
 * @throws Error if the upsert operation fails.
 */
export declare function upsertProductVector(client: WeaviateClient, product: NormalizedProduct, vector: number[]): Promise<string>;
