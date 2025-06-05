import { Pool, Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

/**
 * PostgreSQL connection pool.
 * Configuration is sourced from environment variables:
 * POSTGRES_USER, POSTGRES_HOST, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_PORT
 */
export const pgPool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
});

pgPool.on('error', (err: Error, _client: Client) => {
  console.error('[PostgresService] Unexpected error on idle client', err);
  // process.exit(-1); // Optionally exit if pool errors are critical
});

/**
 * Fetches data from the `price_gaps` view.
 * This view should contain the comparison between Patriot's products and competitor products.
 * 
 * @returns {Promise<any[]>} A promise that resolves to an array of report data rows.
 * @throws {Error} If there is an error querying the database.
 */
export async function fetchReportData(): Promise<any[]> {
  console.log('[PostgresService] Fetching report data from price_gaps view...');
  try {
    const result = await pgPool.query('SELECT * FROM price_gaps;');
    console.log(`[PostgresService] Fetched ${result.rows.length} rows from price_gaps view.`);
    return result.rows;
  } catch (error) {
    console.error('[PostgresService] Error fetching report data:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

// Optional: Test function to verify connection (can be removed or kept for debugging)
async function testConnection() {
  try {
    const client = await pgPool.connect();
    console.log('[PostgresService] Successfully connected to PostgreSQL for test query.');
    const res = await client.query('SELECT NOW()');
    console.log('[PostgresService] Test query result:', res.rows[0]);
    client.release();
  } catch (error) {
    console.error('[PostgresService] Failed to connect or test query PostgreSQL:', error);
  }
}

// testConnection(); // Uncomment to run a quick connection test on module load (for debugging) 