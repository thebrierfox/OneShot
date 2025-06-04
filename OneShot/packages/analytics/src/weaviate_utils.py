import os
import weaviate
from weaviate.auth import AuthApiKey
from dotenv import load_dotenv
from typing import List, Dict, Optional, Any

load_dotenv()

_weaviate_client_instance: Optional[weaviate.ClientV4] = None

PRODUCT_VECTORS_CLASS_NAME = "ProductVectors" # Should match the one in ETL

def get_weaviate_client() -> weaviate.ClientV4:
    """Establishes and returns a connection to the Weaviate v4 client.
    Caches the client instance for reuse.

    Returns:
        weaviate.ClientV4: Initialized Weaviate client.

    Raises:
        Exception: If Weaviate connection fails or required environment variables are missing.
    """
    global _weaviate_client_instance
    if _weaviate_client_instance:
        return _weaviate_client_instance

    weaviate_http_host = os.getenv("WEAVIATE_HOST", "localhost")
    weaviate_http_port = os.getenv("WEAVIATE_HTTP_PORT", "8080")
    weaviate_grpc_port = os.getenv("WEAVIATE_GRPC_PORT", "50051")
    weaviate_api_key = os.getenv("WEAVIATE_API_KEY")
    weaviate_scheme = os.getenv("WEAVIATE_SCHEME", "http")

    if not weaviate_http_host or not weaviate_http_port:
        raise ValueError("[WeaviateUtils] WEAVIATE_HOST or WEAVIATE_HTTP_PORT environment variables are not set.")

    connection_params = weaviate.ConnectionParams(
        http=weaviate.HttpConnectionParams(host=weaviate_http_host, port=int(weaviate_http_port), scheme=weaviate_scheme),
        grpc=weaviate.GrpcConnectionParams(host=weaviate_http_host, port=int(weaviate_grpc_port), secure=False) # Adjust `secure` based on actual setup
    )

    auth_config = None
    if weaviate_api_key:
        auth_config = AuthApiKey(api_key=weaviate_api_key)
        print("[WeaviateUtils] Using API Key for Weaviate authentication.")
    else:
        print("[WeaviateUtils] Weaviate API Key not found, attempting anonymous access.")

    try:
        client = weaviate.ClientV4(
            connection_params=connection_params,
            auth_client_secret=auth_config,
            # additional_headers can be used for other auth methods if needed
        )
        client.is_ready() # Check connection
        _weaviate_client_instance = client
        print(f"[WeaviateUtils] Successfully connected to Weaviate at {weaviate_scheme}://{weaviate_http_host}:{weaviate_http_port}")
        return client
    except Exception as e:
        print(f"[WeaviateUtils] Error connecting to Weaviate: {e}")
        raise

def hybrid_search_products(
    query_vector: List[float],
    query_text: Optional[str] = None,
    alpha: float = 0.5, # 0 for keyword, 1 for vector search
    limit: int = 10,
    filters: Optional[Any] = None, # weaviate.classes.query.Filter a.k.a. WhereFilter in v4
    target_properties: Optional[List[str]] = None
) -> Optional[List[Dict[str, Any]]]:
    """Performs a hybrid search on the ProductVectors class in Weaviate.

    Args:
        query_vector (List[float]): The vector to search with.
        query_text (Optional[str]): The text query for BM25/keyword search. Defaults to None.
        alpha (float): Weighting for hybrid search (0=keyword, 0.5=balanced, 1=vector). Defaults to 0.5.
        limit (int): Maximum number of results to return. Defaults to 10.
        filters (Optional[Any]): Weaviate WhereFilter object for filtering results. Defaults to None.
        target_properties (Optional[List[str]]): List of properties to return for each object.
                                                If None, defaults to common product properties.

    Returns:
        Optional[List[Dict[str, Any]]]: A list of search result objects, or None if error.
    """
    client = get_weaviate_client()
    
    if target_properties is None:
        target_properties = ["postgresProductId", "vendorId", "productName", "category", "sku", "url"]

    try:
        response = client.query.hybrid(
            collection=PRODUCT_VECTORS_CLASS_NAME,
            query=query_text if query_text else "", # BM25 query text; can be empty if alpha is high
            vector=query_vector,
            alpha=alpha,
            limit=limit,
            filters=filters,
            return_metadata=weaviate.classes.query.MetadataQuery(score=True, distance=True, explain_score=True),
            return_properties=target_properties
        )
        
        results = []
        for obj in response.objects:
            item = {"properties": obj.properties, "metadata": obj.metadata}
            results.append(item)
        return results

    except Exception as e:
        print(f"[WeaviateUtils] Error during hybrid search: {e}")
        print(f"  Query Text: {query_text}, Alpha: {alpha}, Limit: {limit}, Filters: {filters}")
        return None

if __name__ == '__main__':
    print("[WeaviateUtils] Running example usage...")
    try:
        # This example assumes Weaviate is running and has the ProductVectors class with some data.
        # It also assumes the embedding_utils.py is in the same directory or PYTHONPATH
        from embedding_utils import generate_embedding_py 

        client = get_weaviate_client()
        print(f"Weaviate ready: {client.is_ready()}")
        
        # 1. Check if class exists (optional, client.is_ready should suffice for connection)
        # collections = client.collections.list_all()
        # print(f"Available collections: {collections}")
        # if PRODUCT_VECTORS_CLASS_NAME not in [c.name for c in collections.values()]:
        # print(f"Warning: Class '{PRODUCT_VECTORS_CLASS_NAME}' does not exist. Search will likely fail.")

        # 2. Prepare a sample query
        sample_search_term = "Instruction: Find similar rental equipment. Product: small excavator"
        sample_vector = generate_embedding_py(sample_search_term) # Uses default model from embedding_utils
        
        print(f"\nPerforming hybrid search for: '{sample_search_term}' (alpha=0.5)")
        
        # Example filter (requires knowing your data and filter structure for v4)
        # from weaviate.classes.query import Filter
        # example_filter = Filter.by_property(name="vendorId").not_equal("patriot")

        search_results = hybrid_search_products(
            query_vector=sample_vector,
            query_text="excavator", # Keyword part of hybrid search
            alpha=0.5, 
            limit=3,
            # filters=example_filter # Uncomment and adapt if you have a filter
        )

        if search_results:
            print(f"Found {len(search_results)} results:")
            for i, result in enumerate(search_results):
                print(f"  Result {i+1}: Propertiers: {result.get('properties')}, Score: {result.get('metadata').score if result.get('metadata') else 'N/A'}")
        elif search_results == []:
            print("No results found for the sample query.")
        else:
            print("Search failed or returned None.")
            
        print("[WeaviateUtils] Example usage completed.")

    except Exception as e:
        print(f"[WeaviateUtils] Example usage failed: {e}") 