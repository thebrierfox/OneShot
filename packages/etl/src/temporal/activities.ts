import { ActivityContext } from '@temporalio/activity';
import type { RawScrapedProduct, VendorConfig } from '@patriot-rentals/shared-types';
import { normalizeRawProductData } from '../services/normalization.service';
import { saveNormalizedProduct } from '../db/postgres.service';
import { generateProductEmbedding } from '../services/embedding.service';
import { getWeaviateClient, upsertProductVector } from '../db/weaviate.service';

export interface EtlProcessActivityResult {
  success: boolean;
  productId?: number;
  error?: string;
  message?: string;
}

/**
 * Temporal Activity to process a raw scraped product through the ETL pipeline.
 * - Normalizes the raw data.
 * - Saves the normalized data to PostgreSQL.
 * - Generates a vector embedding for the product.
 * - Saves the product metadata and vector to Weaviate.
 *
 * @param rawProduct The raw product data scraped from a vendor website.
 * @param vendorConfig Optional configuration for the vendor, used for normalization (e.g., rate parsing).
 * @returns A promise resolving to an object indicating success or failure, along with productId or error details.
 */
export async function etlProcessActivity(
  rawProduct: RawScrapedProduct,
  vendorConfig?: VendorConfig, // VendorConfig is used by normalizationService
): Promise<EtlProcessActivityResult> {
  const logger = ActivityContext.current().log;
  logger.info('Starting ETL process for product', { url: rawProduct.url, vendorId: rawProduct.vendorId });

  try {
    // 1. Normalize Data
    logger.info('Normalizing raw product data...');
    const normalizedProduct = normalizeRawProductData(rawProduct, vendorConfig);
    logger.debug('Normalization complete.', { productName: normalizedProduct.productName });

    // 2. Save to PostgreSQL
    logger.info('Saving normalized product to PostgreSQL...');
    const productId = await saveNormalizedProduct(normalizedProduct);
    normalizedProduct.id = productId; // Crucial: update product object with its new ID from DB
    logger.info(`Product saved to PostgreSQL with ID: ${productId}`);

    // 3. Generate Embedding
    logger.info('Generating product embedding...');
    const vector = await generateProductEmbedding(normalizedProduct);
    logger.info('Embedding generated.', { vectorSize: vector.length });

    // 4. Save to Weaviate
    logger.info('Saving product vector to Weaviate...');
    const weaviateClient = getWeaviateClient();
    const weaviateId = await upsertProductVector(weaviateClient, normalizedProduct, vector);
    logger.info(`Product vector saved to Weaviate with ID: ${weaviateId}`);

    return {
      success: true,
      productId: productId,
      message: `Successfully processed product ID ${productId} from ${rawProduct.vendorId}`,
    };
  } catch (e: any) {
    logger.error('ETL process failed for product', {
      url: rawProduct.url,
      vendorId: rawProduct.vendorId,
      error: e.message,
      stack: e.stack,
    });
    return {
      success: false,
      error: e.message || 'Unknown error during ETL process',
    };
  }
} 