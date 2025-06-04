import os
from typing import List, Optional
from instructor_embedders import InstructorEmbeddings # Assuming this is the correct import
from dotenv import load_dotenv

load_dotenv()

# Initialize the client globally or within a function as needed.
# Consider model loading time for where to best place initialization.
_embedding_client = None
_model_name_loaded = None

def get_embedding_client(model_name: str):
    """Initializes and returns the InstructorEmbeddings client.
    Caches the client for a given model name to avoid reloading.
    """
    global _embedding_client, _model_name_loaded
    if _embedding_client and _model_name_loaded == model_name:
        return _embedding_client
    
    try:
        # Note: Some embedding libraries might require specifying device (cpu, cuda)
        _embedding_client = InstructorEmbeddings(model_name_or_path=model_name)
        _model_name_loaded = model_name
        print(f"[EmbeddingUtils] InstructorEmbeddings client loaded for model: {model_name}")
        return _embedding_client
    except Exception as e:
        print(f"[EmbeddingUtils] Error initializing InstructorEmbeddings model {model_name}: {e}")
        raise

def generate_embedding_py(text_to_embed: str, model_name_override: Optional[str] = None) -> List[float]:
    """Generates an embedding for the given text using InstructorEmbeddings.

    Args:
        text_to_embed (str): The text to generate an embedding for.
        model_name_override (Optional[str]): Specific model name to use. 
                                             If None, uses EMBEDDING_MODEL_NAME from .env or a default.

    Returns:
        List[float]: The generated embedding vector.
    
    Raises:
        Exception: If embedding generation fails.
    """
    default_model = "hkunlp/instructor-base" # Consistent default, can be instructor-large as per .env.example
    model_to_use = model_name_override or os.getenv("EMBEDDING_MODEL_NAME", default_model)

    if not model_to_use:
        raise ValueError("[EmbeddingUtils] Embedding model name not specified and no default found.")

    try:
        client = get_embedding_client(model_to_use)
        # The instructor_embedders library might expect a list of [instruction, text] pairs
        # or a single text if the model is instruction-tuned and doesn't require explicit instruction separation.
        # For simplicity, we'll assume it handles a single text string if no explicit instruction is provided here.
        # If instructions are needed with this library, the input format would be: client.encode([["instruction", text_to_embed]])
        
        # According to instructor-embedding (JS) and common patterns, the text itself should contain the instruction.
        # The directive implies: `Instruction: Represent the equipment rental product... Product: ...`
        # So, the input text_to_embed should already be formatted like that.
        
        embedding = client.encode(text_to_embed) # Assuming .encode() is the method and returns a single vector for a single string.
        
        # Check if the output is a list of lists (e.g., for batch input) and take the first if so.
        if isinstance(embedding, list) and len(embedding) > 0 and isinstance(embedding[0], list):
            print("[EmbeddingUtils] Embedding output was a list of lists, taking the first vector.")
            return embedding[0]
        if isinstance(embedding, list) and all(isinstance(x, float) for x in embedding):
             return embedding # Expected: flat list of floats

        raise TypeError(f"[EmbeddingUtils] Unexpected embedding format received from model {model_to_use}.")

    except Exception as e:
        print(f"[EmbeddingUtils] Error generating embedding with model {model_to_use}: {e}")
        raise

if __name__ == '__main__':
    print("[EmbeddingUtils] Running example usage...")
    try:
        example_text_with_instruction = (
            "Instruction: Represent the Sptre equipment rental product for semantic similarity matching. "
            "Product: Excavator X100 Description: Small powerful excavator. Category: Excavator"
        )
        # Test with default model (usually instructor-base or from .env)
        print(f"Generating embedding for: \"{example_text_with_instruction[:50]}...\" with default model.")
        embedding_vector = generate_embedding_py(example_text_with_instruction)
        print(f"Generated vector (first 5 dimensions): {embedding_vector[:5]}")
        print(f"Vector dimension: {len(embedding_vector)}")

        # Test with a specific model override (if a different one is available/sensible for testing)
        # For this example, we use the same default model name explicitly to test the override path.
        specific_model_name = os.getenv("EMBEDDING_MODEL_NAME", "hkunlp/instructor-base")
        print(f"\nGenerating embedding with specific model: {specific_model_name}")
        embedding_vector_specific = generate_embedding_py(example_text_with_instruction, model_name_override=specific_model_name)
        print(f"Generated vector (specific model, first 5 dims): {embedding_vector_specific[:5]}")
        print(f"Vector dimension (specific model): {len(embedding_vector_specific)}")
        
        print("[EmbeddingUtils] Example usage completed successfully.")

    except Exception as e:
        print(f"[EmbeddingUtils] Example usage failed: {e}") 