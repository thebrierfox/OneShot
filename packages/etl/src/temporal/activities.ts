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
  rawProduct: RawScrapedProduct | RawScrapedProduct[],
  vendorConfig?: VendorConfig,
): Promise<NormalizedProduct> {
  const logger = Context.current().log;
  Context.current().heartbeat('Starting ETL process');

  // Extra safety: log the incoming raw product so we can inspect vendorId issues.
  // Use console.log in addition to Temporal logger because some deployments mute debug logs.
  console.info('[ETL] Incoming RawScrapedProduct', rawProduct);
  logger.debug?.('[ETL] Incoming RawScrapedProduct', { rawProduct });

  // Recursively unwrap until we reach the actual object (Temporal sometimes nests arrays)
  function deepUnwrap(value: any): any {
    while (Array.isArray(value) && value.length === 1) {
      value = value[0];
    }
    return value;
  }

  const product = deepUnwrap(rawProduct) as RawScrapedProduct;

  console.info('[ETL] Unwrapped product', product);
  logger.debug?.('[ETL] Unwrapped product', { product });

  if (!product || typeof product !== 'object' || !product.vendorId) {
    logger.error('Product after unwrap is missing vendorId; ETL cannot proceed.', { product });
    throw new Error('product.vendorId is undefined after unwrap');
  }

  // 1. NORMALIZE
  const normalizedProduct = normalize(product, vendorConfig);
  console.info('[ETL] NormalizedProduct', normalizedProduct);
  logger.debug?.('[ETL] NormalizedProduct', { normalizedProduct });
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