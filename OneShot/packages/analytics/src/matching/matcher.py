import os
import pandas as pd
import json
from typing import List, Dict, Any, Optional

# Assuming db_utils, embedding_utils, and weaviate_utils are in the parent directory (src)
# If running matcher.py directly for testing, ensure PYTHONPATH is set or use relative imports if structured as a package.
from .. import db_utils # Relative import for package structure
from .. import embedding_utils
from .. import weaviate_utils
from weaviate.classes.query import Filter # For type hinting and usage

DEFAULT_PATRIOT_CATALOG_PATH = "./config/patriot_catalog.csv" # Relative to project root
DEFAULT_PATRIOT_CONFIG_PATH = "./config/patriot_catalog_config.json" # Relative to project root

# Default similarity threshold (e.g., Weaviate score). Tune based on testing.
# Weaviate scores are often normalized (0 to 1), higher is better.
# Distances (like cosine distance) are lower is better (0 is identical).
# The `hybrid_search_products` returns `score` in metadata.
DEFAULT_SIMILARITY_THRESHOLD = 0.75 

class ProductMatcher:
    """Matches competitor products against Patriot\'s catalog using embeddings and Weaviate search."""

    def __init__(
        self,
        patriot_catalog_path: Optional[str] = None,
        patriot_config_path: Optional[str] = None,
        similarity_threshold: Optional[float] = None
    ):
        """Initializes the ProductMatcher.

        Args:
            patriot_catalog_path (Optional[str]): Path to Patriot catalog CSV. Defaults to env or DEFAULT_PATRIOT_CATALOG_PATH.
            patriot_config_path (Optional[str]): Path to Patriot catalog config JSON. Defaults to env or DEFAULT_PATRIOT_CONFIG_PATH.
            similarity_threshold (Optional[float]): Minimum similarity score to consider a match. Defaults to DEFAULT_SIMILARITY_THRESHOLD.
        """
        self.patriot_catalog_path = patriot_catalog_path or os.getenv("PATRIOT_CATALOG_FILE_PATH", DEFAULT_PATRIOT_CATALOG_PATH)
        self.patriot_config_path = patriot_config_path or DEFAULT_PATRIOT_CONFIG_PATH
        self.similarity_threshold = similarity_threshold if similarity_threshold is not None else DEFAULT_SIMILARITY_THRESHOLD
        
        self.patriot_catalog_df: Optional[pd.DataFrame] = None
        self.patriot_catalog_config: Optional[Dict[str, str]] = None
        
        print(f"[ProductMatcher] Initialized with catalog: {self.patriot_catalog_path}, config: {self.patriot_config_path}")

    def load_patriot_catalog(self) -> None:
        """Loads the Patriot catalog CSV into a Pandas DataFrame based on config."""
        try:
            with open(self.patriot_config_path, 'r') as f:
                self.patriot_catalog_config = json.load(f)
            
            if not self.patriot_catalog_config:
                raise ValueError("Patriot catalog config could not be loaded or is empty.")

            self.patriot_catalog_df = pd.read_csv(self.patriot_catalog_path)
            # Basic validation of required columns based on config
            required_cols = [
                self.patriot_catalog_config['skuColumnName'], 
                self.patriot_catalog_config['nameColumnName']
            ]
            for col in required_cols:
                if col not in self.patriot_catalog_df.columns:
                    raise ValueError(f"Required column '{col}' not found in Patriot catalog CSV.")
            print(f"[ProductMatcher] Patriot catalog loaded successfully: {len(self.patriot_catalog_df)} items.")
        except Exception as e:
            print(f"[ProductMatcher] Error loading Patriot catalog: {e}")
            self.patriot_catalog_df = None
            self.patriot_catalog_config = None
            raise

    def embed_patriot_catalog_item(self, patriot_item: pd.Series) -> Optional[List[float]]:
        """Generates an embedding for a single Patriot catalog item."""
        if self.patriot_catalog_df is None or self.patriot_catalog_config is None:
            print("[ProductMatcher] Patriot catalog not loaded. Cannot embed item.")
            return None
        
        try:
            name_col = self.patriot_catalog_config['nameColumnName']
            desc_col = self.patriot_catalog_config.get('descriptionColumnName', '') # Optional
            cat_col = self.patriot_catalog_config.get('categoryColumnName', '')    # Optional

            product_name = patriot_item[name_col] if pd.notna(patriot_item[name_col]) else ""
            description = patriot_item.get(desc_col, "") if desc_col and desc_col in patriot_item and pd.notna(patriot_item[desc_col]) else ""
            category = patriot_item.get(cat_col, "") if cat_col and cat_col in patriot_item and pd.notna(patriot_item[cat_col]) else ""

            text_to_embed = (
                f"Instruction: Represent the equipment rental product for semantic similarity matching and price comparison. "
                f"Product: {product_name} Description: {description} Category: {category}"
            ).strip()
            
            # Uses the generate_embedding_py function from embedding_utils
            # model_name for Patriot items could be fixed or also from env/config
            return embedding_utils.generate_embedding_py(text_to_embed)
        except Exception as e:
            sku_col = self.patriot_catalog_config['skuColumnName']
            patriot_sku = patriot_item.get(sku_col, "Unknown SKU")
            print(f"[ProductMatcher] Error generating embedding for Patriot SKU {patriot_sku}: {e}")
            return None

    def match_single_patriot_item(self, patriot_item: pd.Series) -> List[Dict[str, Any]]:
        """Finds matches for a single Patriot item in Weaviate.

        Args:
            patriot_item (pd.Series): A row from the Patriot catalog DataFrame.

        Returns:
            List[Dict[str, Any]]: List of matched competitor product data (properties and metadata).
        """
        if self.patriot_catalog_config is None:
            self.load_patriot_catalog()
            if self.patriot_catalog_config is None:
                return [] # Failed to load config
                
        patriot_sku = patriot_item[self.patriot_catalog_config['skuColumnName']]
        print(f"[ProductMatcher] Matching Patriot SKU: {patriot_sku}")

        embedding_vector = self.embed_patriot_catalog_item(patriot_item)
        if not embedding_vector:
            print(f"[ProductMatcher] Could not generate embedding for SKU {patriot_sku}. Skipping match.")
            return []

        # Prepare query text for BM25 part of hybrid search
        name_col = self.patriot_catalog_config['nameColumnName']
        query_text = patriot_item.get(name_col, "")

        # Filter out Patriot\'s own listings if they are in Weaviate with vendorId 'patriot'
        # Also filter by any other criteria if needed.
        # The exact structure of filters depends on the weaviate client version.
        # For v4, using weaviate.classes.query.Filter
        weaviate_filter = Filter.by_property(name="vendorId").not_equal("patriot")
        # Add more filters if necessary, e.g., Filter.by_property(...).greater_than(...) etc.

        try:
            search_results = weaviate_utils.hybrid_search_products(
                query_vector=embedding_vector,
                query_text=query_text,
                alpha=0.6, # Slightly favor vector search, tune this parameter
                limit=5,   # Max 5 matches per Patriot item, tune this
                filters=weaviate_filter,
                target_properties=["postgresProductId", "vendorId", "productName", "url", "sku"] # Key fields for matching
            )

            if not search_results:
                print(f"[ProductMatcher] No results from Weaviate for SKU {patriot_sku}.")
                return []

            matched_products = []
            for res in search_results:
                score = res.get('metadata').score if res.get('metadata') else 0.0
                if score >= self.similarity_threshold:
                    # postgresProductId is the ID from the normalized_products table
                    # This is what we need to update in Postgres
                    competitor_postgres_id = res['properties'].get('postgresProductId')
                    if competitor_postgres_id:
                        matched_products.append({
                            'competitor_postgres_id': competitor_postgres_id,
                            'competitor_vendor_id': res['properties'].get('vendorId'),
                            'competitor_product_name': res['properties'].get('productName'),
                            'competitor_url': res['properties'].get('url'),
                            'similarity_score': score
                        })
                    else:
                        print(f"[ProductMatcher] Warning: Match for SKU {patriot_sku} found with score {score} but missing postgresProductId: {res['properties']}")
                else:
                    print(f"[ProductMatcher] Match for SKU {patriot_sku} below threshold ({score} < {self.similarity_threshold}): {res['properties'].get('productName')}")
            
            print(f"[ProductMatcher] Found {len(matched_products)} suitable matches for SKU {patriot_sku}.")
            return matched_products

        except Exception as e:
            print(f"[ProductMatcher] Error during Weaviate search for SKU {patriot_sku}: {e}")
            return []

    def update_postgres_match(self, patriot_sku: str, competitor_postgres_id: int) -> None:
        """Updates the normalized_products table in Postgres to link a competitor product to a Patriot SKU."""
        try:
            # Ensure `updateProductMatch` function exists and is correctly imported from db_utils
            # It expects (productId, patriotSku)
            db_utils.execute_query(
                "UPDATE normalized_products SET patriot_sku = %s, last_matched_at = NOW() WHERE id = %s",
                (patriot_sku, competitor_postgres_id)
            )
            print(f"[ProductMatcher] Successfully updated Postgres: Patriot SKU {patriot_sku} matched to competitor product ID {competitor_postgres_id}.")
        except Exception as e:
            print(f"[ProductMatcher] Error updating Postgres for Patriot SKU {patriot_sku}, Competitor ID {competitor_postgres_id}: {e}")

    def match_all_patriot_products(self) -> None:
        """Iterates through the Patriot catalog, finds matches, and updates Postgres."""
        if self.patriot_catalog_df is None or self.patriot_catalog_config is None:
            self.load_patriot_catalog()
            if self.patriot_catalog_df is None: # Check again if loading failed
                print("[ProductMatcher] Cannot proceed: Patriot catalog failed to load.")
                return

        total_items = len(self.patriot_catalog_df)
        print(f"[ProductMatcher] Starting matching process for {total_items} Patriot catalog items...")
        
        # Get the SKU column name from config
        sku_col = self.patriot_catalog_config['skuColumnName']

        for index, patriot_item_series in self.patriot_catalog_df.iterrows():
            patriot_sku = patriot_item_series[sku_col]
            print(f"\n--- Processing Patriot Item {index + 1}/{total_items} (SKU: {patriot_sku}) ---")
            
            matched_competitors = self.match_single_patriot_item(patriot_item_series)
            
            if matched_competitors:
                # For simplicity, this example links all found suitable matches.
                # Business logic might dictate picking only the top match or other rules.
                for match in matched_competitors:
                    self.update_postgres_match(patriot_sku, match['competitor_postgres_id'])
            else:
                print(f"[ProductMatcher] No suitable matches found for Patriot SKU {patriot_sku} above threshold.")
        
        print("[ProductMatcher] Matching process completed for all Patriot items.")


if __name__ == '__main__':
    print("[ProductMatcher] Running example usage...")
    # This example requires Postgres and Weaviate to be running and populated.
    # It also assumes patriot_catalog.csv and patriot_catalog_config.json are in ../../config/
    # relative to this file if run directly, or that paths are correctly set via env vars.

    # Adjust paths for direct execution if necessary, or rely on default env vars.
    # Example: '../../config/patriot_catalog.csv'
    # Ensure environment variables for DB and Weaviate are set in your .env file at project root.
    
    # For the example to run, embedding_utils needs to find its model,
    # and weaviate_utils needs to connect. db_utils also needs to connect.
    
    try:
        matcher = ProductMatcher(
            # Ensure these paths are correct if running this script directly
            # Or that PATRIOT_CATALOG_FILE_PATH env var is set
            patriot_catalog_path=os.path.join(os.path.dirname(__file__), '..\..\..\config', 'patriot_catalog.csv'),
            patriot_config_path=os.path.join(os.path.dirname(__file__), '..\..\..\config', 'patriot_catalog_config.json')
        )
        # To test fully, you\'d need data in your Weaviate and Postgres.
        # This call will attempt to load catalog, embed, search, and update.
        matcher.match_all_patriot_products()
        print("[ProductMatcher] Example usage completed.")
    except Exception as e:
        print(f"[ProductMatcher] Example usage failed: {e}")
        import traceback
        traceback.print_exc() 