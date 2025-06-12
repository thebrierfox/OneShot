"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closePgPool = exports.updateProductMatch = exports.getProductByUrlAndVendor = exports.saveNormalizedProduct = void 0;
const dotenv = __importStar(require("dotenv"));
const pg_1 = require("pg");
dotenv.config();
let pgPool = null;
/**
 * Initializes and returns a singleton PostgreSQL connection pool.
 * @returns The PostgreSQL Pool instance.
 * @throws Error if PostgreSQL environment variables are not set.
 */
function getPgPool() {
    if (pgPool) {
        return pgPool;
    }
    const { POSTGRES_USER, POSTGRES_HOST, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_PORT } = process.env;
    if (!POSTGRES_USER || !POSTGRES_HOST || !POSTGRES_DB || !POSTGRES_PASSWORD || !POSTGRES_PORT) {
        throw new Error('PostgreSQL connection environment variables are not fully set.');
    }
    pgPool = new pg_1.Pool({
        user: POSTGRES_USER,
        host: POSTGRES_HOST,
        database: POSTGRES_DB,
        password: POSTGRES_PASSWORD,
        port: parseInt(POSTGRES_PORT, 10),
    });
    pgPool.on('error', (err) => {
        console.error('Unexpected error on idle PostgreSQL client', err);
        // Optional: attempt to re-initialize pool or exit process
    });
    return pgPool;
}
// Immediately initialize the pool and create table if not exists
(async () => {
    try {
        const pool = getPgPool();
        await pool.query(`
      CREATE TABLE IF NOT EXISTS normalized_products (
        id SERIAL PRIMARY KEY,
        vendor_id VARCHAR(100) NOT NULL,
        url TEXT NOT NULL,
        scraped_at TIMESTAMPTZ NOT NULL,
        product_name TEXT,
        day_rate NUMERIC(10, 2),
        week_rate NUMERIC(10, 2),
        month_rate NUMERIC(10, 2),
        currency VARCHAR(10),
        sku VARCHAR(255),
        description TEXT,
        image_url TEXT,
        category TEXT,
        patriot_sku VARCHAR(255),
        last_matched_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT unique_vendor_url UNIQUE (vendor_id, url)
      );
    `);
        // Create a trigger to automatically update updated_at column
        await pool.query(`
      CREATE OR REPLACE FUNCTION trigger_set_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$
      LANGUAGE plpgsql;
    `);
        await pool.query(`
      DROP TRIGGER IF EXISTS set_timestamp_normalized_products ON normalized_products;
      CREATE TRIGGER set_timestamp_normalized_products
      BEFORE UPDATE ON normalized_products
      FOR EACH ROW
      EXECUTE PROCEDURE trigger_set_timestamp();
    `);
        console.log('PostgreSQL normalized_products table checked/created successfully.');
    }
    catch (error) {
        console.error('Error initializing PostgreSQL table:', error);
        // Consider exiting if the DB setup fails critically
        // process.exit(1);
    }
})();
/**
 * Saves a normalized product to the database.
 * Performs an UPSERT operation based on the unique constraint (vendor_id, url).
 * @param product The NormalizedProduct object to save.
 * @returns The saved product object, including the database-generated ID.
 * @throws Error if the database operation fails.
 */
async function saveNormalizedProduct(product) {
    const pool = getPgPool();
    const { vendorId, url, scrapedAt, productName, dayRate, weekRate, monthRate, currency, sku, description, imageUrl, category, patriotSku, lastMatchedAt, } = product;
    const query = `
    INSERT INTO normalized_products (
      vendor_id, url, scraped_at, product_name, day_rate, week_rate, month_rate, 
      currency, sku, description, image_url, category, patriot_sku, last_matched_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    ON CONFLICT (vendor_id, url) DO UPDATE SET
      scraped_at = EXCLUDED.scraped_at,
      product_name = EXCLUDED.product_name,
      day_rate = EXCLUDED.day_rate,
      week_rate = EXCLUDED.week_rate,
      month_rate = EXCLUDED.month_rate,
      currency = EXCLUDED.currency,
      sku = EXCLUDED.sku,
      description = EXCLUDED.description,
      image_url = EXCLUDED.image_url,
      category = EXCLUDED.category,
      patriot_sku = COALESCE(normalized_products.patriot_sku, EXCLUDED.patriot_sku),
      last_matched_at = COALESCE(normalized_products.last_matched_at, EXCLUDED.last_matched_at)
    RETURNING id, vendor_id AS "vendorId", url, scraped_at AS "scrapedAt", product_name AS "productName", day_rate AS "dayRate", week_rate AS "weekRate", month_rate AS "monthRate", currency, sku, description, image_url AS "imageUrl", category, patriot_sku AS "patriotSku", last_matched_at AS "lastMatchedAt";
  `;
    const values = [
        vendorId,
        url,
        scrapedAt,
        productName,
        dayRate,
        weekRate,
        monthRate,
        currency,
        sku,
        description,
        imageUrl,
        category,
        patriotSku,
        lastMatchedAt,
    ];
    try {
        const res = await pool.query(query, values);
        if (res.rows.length > 0) {
            return res.rows[0];
        }
        throw new Error('Failed to save product, no data returned.');
    }
    catch (error) {
        console.error('Error saving normalized product:', error);
        throw error;
    }
}
exports.saveNormalizedProduct = saveNormalizedProduct;
/**
 * Retrieves a normalized product by its URL and vendor ID.
 * @param url The URL of the product.
 * @param vendorId The vendor ID of the product.
 * @returns A Promise resolving to the NormalizedProduct object or null if not found.
 */
async function getProductByUrlAndVendor(url, vendorId) {
    const pool = getPgPool();
    const query = `
    SELECT 
      id, vendor_id AS "vendorId", url, scraped_at AS "scrapedAt", product_name AS "productName", 
      day_rate AS "dayRate", week_rate AS "weekRate", month_rate AS "monthRate", 
      currency, sku, description, image_url AS "imageUrl", category, 
      patriot_sku AS "patriotSku", last_matched_at AS "lastMatchedAt"
    FROM normalized_products
    WHERE vendor_id = $1 AND url = $2;
  `;
    try {
        const res = await pool.query(query, [vendorId, url]);
        return res.rows[0] || null;
    }
    catch (error) {
        console.error(`Error getting product by URL ${url} and vendor ${vendorId}:`, error);
        throw error;
    }
}
exports.getProductByUrlAndVendor = getProductByUrlAndVendor;
/**
 * Updates the Patriot SKU match for a given product ID.
 * @param productId The ID of the product in the normalized_products table.
 * @param patriotSku The Patriot SKU to match.
 * @returns A Promise resolving when the update is complete.
 */
async function updateProductMatch(productId, patriotSku) {
    const pool = getPgPool();
    const query = `
    UPDATE normalized_products
    SET patriot_sku = $1, last_matched_at = NOW()
    WHERE id = $2;
  `;
    try {
        await pool.query(query, [patriotSku, productId]);
    }
    catch (error) {
        console.error(`Error updating product match for product ID ${productId}:`, error);
        throw error;
    }
}
exports.updateProductMatch = updateProductMatch;
/**
 * Closes the PostgreSQL connection pool.
 * Intended for graceful shutdown.
 */
async function closePgPool() {
    if (pgPool) {
        await pgPool.end();
        pgPool = null;
        console.log('PostgreSQL pool has been closed.');
    }
}
exports.closePgPool = closePgPool;
//# sourceMappingURL=postgres.service.js.map