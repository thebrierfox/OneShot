// @xenova/transformers is ESM-only; load at runtime via dynamic import to stay compatible with CommonJS build.
import type { Pipeline } from '@xenova/transformers';
import type { NormalizedProduct } from '@patriot-rentals/shared-types';

const DEFAULT_EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
const TASK = 'feature-extraction';

class EmbeddingPipeline {
  static task = TASK;
  static model = process.env.EMBEDDING_MODEL_NAME || DEFAULT_EMBEDDING_MODEL;
  static instance: any | null = null;

  static async getInstance(progress_callback?: Function) {
    if (this.instance === null) {
      const pipelineFn = await getPipeline();
      this.instance = await pipelineFn(this.task as any, this.model as any, { progress_callback });
    }
    return this.instance;
  }
}

let _pipeline: typeof import('@xenova/transformers').pipeline | null = null;

async function getPipeline() {
  if (!_pipeline) {
    const mod = await import('@xenova/transformers');
    _pipeline = mod.pipeline;
  }
  return _pipeline!;
}

/**
 * Generates a vector embedding for a given normalized product.
 * @param product The NormalizedProduct object.
 * @returns A Promise resolving to an array of numbers representing the product embedding.
 */
export async function generateProductEmbedding(product: NormalizedProduct): Promise<number[]> {
  const textToEmbed = `${product.productName || ''} ${product.description || ''} ${product.category || ''}`.trim();
  
  if (!textToEmbed) {
    console.warn(`[EmbeddingService] Product with URL ${product.url} has no text content to embed.`);
    // Return a zero-vector or handle as an error, depending on requirements.
    // For now, returning a zero-vector of a common dimension size (e.g., 384 for all-MiniLM-L6-v2)
    return new Array(384).fill(0);
  }

  const embedder = await EmbeddingPipeline.getInstance();
  const embeddingTensor = await embedder(textToEmbed, {
      pooling: 'mean',
      normalize: true,
  });
  
  return Array.from(embeddingTensor.data);
} 