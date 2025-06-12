import { Context } from '@temporalio/activity';
import type { RawScrapedProduct, VendorConfig, NormalizedProduct } from '@patriot-rentals/shared-types';
import { normalize } from '../services/normalization.service';
import { generateProductEmbedding } from '../services/embedding.service';
import { getWeaviateClient, upsertProductVector } from '../db/weaviate.service';
import { saveNormalizedProduct } from '../db/postgres.service';

/**
 * Main ETL activity. Orchestrates normalization, embedding, and loading of data.
 * @param rawProduct The raw scraped product data.
 * @param vendorConfig The configuration for the vendor.
 * @returns The fully processed and saved NormalizedProduct.
 */
export async function etlProcessActivity(
  rawProduct: RawScrapedProduct,
  vendorConfig?: VendorConfig,
): Promise<NormalizedProduct> {
  const logger = Context.current().log;
  Context.current().heartbeat('Starting ETL process');

  // 1. NORMALIZE
  const normalizedProduct = normalize(rawProduct, vendorConfig);
  Context.current().heartbeat('Product normalized');

  // 2. EMBED
  const embedding = await generateProductEmbedding(normalizedProduct);
  Context.current().heartbeat('Embedding generated');

  // 3. LOAD
  const savedProduct = await saveNormalizedProduct(normalizedProduct);
  logger.info('Product saved to PostgreSQL', { id: savedProduct.id });
  Context.current().heartbeat('Saved to PostgreSQL');

  const weaviateClient = getWeaviateClient();
  await upsertProductVector(weaviateClient, savedProduct, embedding);
  logger.info('Product saved to Weaviate', { postgresId: savedProduct.id });
  Context.current().heartbeat('Saved to Weaviate');

  return savedProduct;
} 