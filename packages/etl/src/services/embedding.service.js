"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateProductEmbedding = void 0;
const transformers_1 = require("@xenova/transformers");
const DEFAULT_EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
const TASK = 'feature-extraction';
class EmbeddingPipeline {
    static task = TASK;
    static model = process.env.EMBEDDING_MODEL_NAME || DEFAULT_EMBEDDING_MODEL;
    static instance = null;
    static async getInstance(progress_callback) {
        if (this.instance === null) {
            this.instance = await (0, transformers_1.pipeline)(this.task, this.model, { progress_callback });
        }
        return this.instance;
    }
}
/**
 * Generates a vector embedding for a given normalized product.
 * @param product The NormalizedProduct object.
 * @returns A Promise resolving to an array of numbers representing the product embedding.
 */
async function generateProductEmbedding(product) {
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
exports.generateProductEmbedding = generateProductEmbedding;
//# sourceMappingURL=embedding.service.js.map