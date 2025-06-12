"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.etlProcessActivity = void 0;
const activity_1 = require("@temporalio/activity");
const normalization_service_1 = require("../services/normalization.service");
const embedding_service_1 = require("../services/embedding.service");
const weaviate_service_1 = require("../db/weaviate.service");
const postgres_service_1 = require("../db/postgres.service");
/**
 * Main ETL activity. Orchestrates normalization, embedding, and loading of data.
 * @param rawProduct The raw scraped product data.
 * @param vendorConfig The configuration for the vendor.
 * @returns The fully processed and saved NormalizedProduct.
 */
async function etlProcessActivity(rawProduct, vendorConfig) {
    const logger = activity_1.Context.current().log;
    activity_1.Context.current().heartbeat('Starting ETL process');
    // 1. NORMALIZE
    const normalizedProduct = (0, normalization_service_1.normalize)(rawProduct, vendorConfig);
    activity_1.Context.current().heartbeat('Product normalized');
    // 2. EMBED
    const embedding = await (0, embedding_service_1.generateProductEmbedding)(normalizedProduct);
    activity_1.Context.current().heartbeat('Embedding generated');
    // 3. LOAD
    const savedProduct = await (0, postgres_service_1.saveNormalizedProduct)(normalizedProduct);
    logger.info('Product saved to PostgreSQL', { id: savedProduct.id });
    activity_1.Context.current().heartbeat('Saved to PostgreSQL');
    const weaviateClient = (0, weaviate_service_1.getWeaviateClient)();
    await (0, weaviate_service_1.upsertProductVector)(weaviateClient, savedProduct, embedding);
    logger.info('Product saved to Weaviate', { postgresId: savedProduct.id });
    activity_1.Context.current().heartbeat('Saved to Weaviate');
    return savedProduct;
}
exports.etlProcessActivity = etlProcessActivity;
//# sourceMappingURL=activities.js.map