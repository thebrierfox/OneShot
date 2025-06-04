import * as dotenv from 'dotenv';
import { InstructorEmbedding } from 'instructor-embedding';
import type { NormalizedProduct } from '@patriot-rentals/shared-types';

dotenv.config();

const DEFAULT_EMBEDDING_MODEL = 'hkunlp/instructor-base'; // Default model if not specified in .env

if (!process.env.EMBEDDING_MODEL_NAME) {
  console.warn(`EMBEDDING_MODEL_NAME not set in environment variables. Using default: ${DEFAULT_EMBEDDING_MODEL}`);
}

export const embeddingClient = new InstructorEmbedding({
  modelName: process.env.EMBEDDING_MODEL_NAME || DEFAULT_EMBEDDING_MODEL,
});

/**
 * Generates a vector embedding for a given normalized product.
 * The embedding is created based on a combination of the product's name, description, and category,
 * prefixed with a specific instruction for the embedding model.
 *
 * @param product The NormalizedProduct object for which to generate an embedding.
 * @returns A Promise resolving to an array of numbers representing the product embedding.
 * @throws Error if the embedding generation fails.
 */
export async function generateProductEmbedding(product: NormalizedProduct): Promise<number[]> {
  if (!product.productName) {
    console.warn(`[EmbeddingService] Product with URL ${product.url} has no name. Embedding quality may be affected.`);
  }

  const instruction = 'Represent the equipment rental product for semantic similarity matching and price comparison.';
  const productName = product.productName || 'Unknown Product';
  const description = product.description || '';
  const category = product.category || '';

  // Constructing the text with clear separation and handling of potentially missing fields.
  const textToEmbed = `Instruction: ${instruction}\nProduct: ${productName}\nDescription: ${description}\nCategory: ${category}`.trim();

  try {
    // The `embed` method of InstructorEmbedding typically expects an array of texts or a single text based on its version.
    // Assuming it can handle a single text directly for a single embedding based on common patterns.
    // If it strictly expects an array for sentences/queries, it would be `await embeddingClient.embed([textToEmbed])`
    // and then we would take the first element of the result if it returns an array of embeddings.
    // For now, let's assume `embed` can take a single string and returns a single embedding array.
    const embedding = await embeddingClient.embed(textToEmbed);
    
    // Validate that we got a single embedding array of numbers
    if (Array.isArray(embedding) && embedding.every(num => typeof num === 'number')) {
        return embedding;
    } else if (Array.isArray(embedding) && Array.isArray(embedding[0]) && (embedding[0] as any[]).every(num => typeof num === 'number')){
        // Some embedders return [[vector]] for single texts
        console.warn('[EmbeddingService] Embedding client returned a nested array for a single text. Taking the first element.')
        return embedding[0] as number[];
    }
    
    console.error('[EmbeddingService] Failed to generate a valid embedding. Result was not a flat array of numbers:', embedding);
    throw new Error('Failed to generate a valid product embedding.');

  } catch (error) {
    console.error(`[EmbeddingService] Error generating embedding for product URL ${product.url}:`, error);
    throw error; // Re-throw the error to be handled by the caller
  }
} 