import * as dotenv from 'dotenv';
import weaviate, { WeaviateClient, ApiKey, ConnectionParams, WeaviateClass } from 'weaviate-ts-client';
import type { NormalizedProduct } from '@patriot-rentals/shared-types';

dotenv.config();

let weaviateClientInstance: WeaviateClient | null = null;

const PRODUCT_VECTORS_CLASS_NAME = 'ProductVectors';

/**
 * Initializes and returns a singleton Weaviate client.
 * @returns The WeaviateClient instance.
 * @throws Error if Weaviate environment variables are not set.
 */
export function getWeaviateClient(): WeaviateClient {
  if (weaviateClientInstance) {
    return weaviateClientInstance;
  }

  const scheme = process.env.WEAVIATE_SCHEME || 'http';
  const host = process.env.WEAVIATE_HOST;
  const apiKey = process.env.WEAVIATE_API_KEY ? new ApiKey(process.env.WEAVIATE_API_KEY) : undefined;

  if (!host) {
    throw new Error('WEAVIATE_HOST environment variable is not set.');
  }

  const connectionParams: ConnectionParams = {
    scheme: scheme as 'http' | 'https',
    host,
  };

  if (apiKey) {
    console.warn('WEAVIATE_API_KEY is set, but weaviate-ts-client connection may need specific auth config if it is for Weaviate Cloud. This setup assumes anonymous access or other auth for direct connections.');
  }

  weaviateClientInstance = weaviate.client(connectionParams);
  return weaviateClientInstance;
}

/**
 * Ensures the ProductVectors class schema exists in Weaviate.
 * @param client The WeaviateClient instance.
 * @throws Error if schema creation fails.
 */
export async function ensureProductSchemaExists(client: WeaviateClient): Promise<void> {
  try {
    const existingSchema = await client.schema.classGetter().withClassName(PRODUCT_VECTORS_CLASS_NAME).do();
    if (existingSchema) {
      return;
    }
  } catch (e) {
    // Class probably doesn't exist, proceed to create.
  }

  const classSchema: WeaviateClass = {
    class: PRODUCT_VECTORS_CLASS_NAME,
    description: 'Stores product information and their corresponding embedding vectors.',
    vectorizer: 'none', // We provide our own vectors
    properties: [
      {
        name: 'postgresProductId',
        dataType: ['int'],
        description: 'The ID of the product in the PostgreSQL database',
      },
      {
        name: 'vendorId',
        dataType: ['string'],
        description: 'Vendor ID',
        tokenization: 'word',
      },
      {
        name: 'productName',
        dataType: ['text'],
        description: 'Product name',
        tokenization: 'word',
      },
      {
        name: 'category',
        dataType: ['text'],
        description: 'Product category',
        tokenization: 'word',
      },
      {
        name: 'sku',
        dataType: ['string'],
        description: 'Vendor SKU',
        tokenization: 'field',
      },
      {
        name: 'url',
        dataType: ['string'],
        description: 'Product URL',
        tokenization: 'field',
      }
    ],
  };

  try {
    await client.schema.classCreator().withClass(classSchema).do();
    console.log(`Weaviate class '${PRODUCT_VECTORS_CLASS_NAME}' created successfully.`);
  } catch (error) {
    console.error(`Failed to create Weaviate class '${PRODUCT_VECTORS_CLASS_NAME}':`, error);
    throw error;
  }
}

(async () => {
  try {
    const client = getWeaviateClient();
    await ensureProductSchemaExists(client);
  } catch (error) {
    console.error('Failed to initialize Weaviate schema on load:', error);
  }
})();

/**
 * Upserts a product vector and its associated metadata to Weaviate.
 * This function implements an explicit query-then-write upsert logic.
 * @param client The WeaviateClient instance.
 * @param product The NormalizedProduct object.
 * @param vector The embedding vector for the product.
 * @returns The Weaviate ID of the upserted object.
 * @throws Error if the upsert operation fails.
 */
export async function upsertProductVector(
  client: WeaviateClient,
  product: NormalizedProduct,
  vector: number[],
): Promise<string> {
  if (!product.id) {
    throw new Error('Product must have an ID (postgresProductId) to be upserted to Weaviate.');
  }

  const dataObject = {
    postgresProductId: product.id,
    vendorId: product.vendorId,
    productName: product.productName,
    category: product.category,
    sku: product.sku,
    url: product.url,
  };

  let existingWeaviateId: string | undefined;
  try {
    const queryObject = await client.graphql
      .get()
      .withClassName(PRODUCT_VECTORS_CLASS_NAME)
      .withFields('_additional { id }')
      .withWhere({
        operator: 'Equal',
        path: ['postgresProductId'],
        valueInt: product.id,
      })
      .withLimit(1)
      .do();
    
    if (queryObject.data.Get[PRODUCT_VECTORS_CLASS_NAME]?.length > 0) {
      existingWeaviateId = queryObject.data.Get[PRODUCT_VECTORS_CLASS_NAME][0]._additional.id;
    }
  } catch (searchError) {
    console.warn(`Could not search for existing Weaviate object for postgresProductId ${product.id}:`, searchError);
  }

  try {
    if (existingWeaviateId) {
      await client.data
        .updater()
        .withId(existingWeaviateId)
        .withClassName(PRODUCT_VECTORS_CLASS_NAME)
        .withProperties(dataObject)
        .withVector(vector)
        .do();
      return existingWeaviateId;
    } else {
      const result = await client.data
        .creator()
        .withClassName(PRODUCT_VECTORS_CLASS_NAME)
        .withProperties(dataObject)
        .withVector(vector)
        .do();
      return result.id as string; 
    }
  } catch (error) {
    console.error(`Error upserting product vector for postgresProductId ${product.id}:`, error);
    throw error;
  }
}

/**
 * Generates a Weaviate-compatible UUID based on a Postgres product ID.
 * This helps in making upserts idempotent if Weaviate is configured to use specific IDs.
 * Weaviate generates its own UUIDs by default if no ID is provided.
 * For deterministic IDs, you need to hash your input consistently.
 * @param postgresProductId The product ID from PostgreSQL.
 * @returns A string representing the Weaviate object ID.
 */
function generateWeaviateId(postgresProductId: number): string {
  // Weaviate expects a UUID. A common way is to use a namespace and hash.
  // For simplicity, and if not strictly needing UUID format for external reasons,
  // a prefix + ID can work if Weaviate allows non-UUID string IDs.
  // However, official client and docs lean towards UUIDs.
  // Let's assume weaviate will auto-generate the ID for simplicity of upsert, as true upsert by custom ID is more complex.
  // This function is more of a placeholder if custom ID generation strategy is adopted.
  // For now, we will rely on Weaviate to generate ID or use its upsert mechanisms that might not require manual ID generation.
  // A robust solution for custom IDs would involve hashing, e.g., with SHA1 and a namespace.
  // return `product-${postgresProductId}`; // Example of simple non-UUID id. Client might reject.
  // For actual UUID generation from a seed (like postgresProductId), a library like `uuid` would be used.
  // Example: import { v5 as uuidv5 } from 'uuid'; const NAMESPACE = 'YOUR_UUID_NAMESPACE'; 
  // return uuidv5(String(postgresProductId), NAMESPACE);
  console.warn('generateWeaviateId is a placeholder; Weaviate will auto-generate IDs for now.');
  return String(postgresProductId); // This won't be a UUID. We will not set it explicitly in data object for now.
} 