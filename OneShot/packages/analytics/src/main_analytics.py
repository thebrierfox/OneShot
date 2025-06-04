import argparse
import os
from dotenv import load_dotenv

# Ensure project root is in path for relative imports if running script directly
# This might be needed if you run `python src/main_analytics.py` from `packages/analytics`
# For pnpm script `python src/main_analytics.py` run from project root, direct relative imports should work.
# import sys
# sys.path.append(os.path.join(os.path.dirname(__file__), '..')) # Adds src to path

from .matching.matcher import ProductMatcher
from .reporting.db_views import create_price_gaps_view
# db_utils, embedding_utils, weaviate_utils are used by the above modules

def main():
    load_dotenv(dotenv_path=os.path.join(os.getcwd(), '.env')) # Load .env from project root
    
    parser = argparse.ArgumentParser(description="Patriot Rentals Analytics CLI.")
    parser.add_argument(
        '--action',
        required=True,
        choices=['match_products', 'create_views'],
        help='The analytics action to perform.'
    )
    # Add other arguments if needed, e.g., for overriding catalog paths or similarity thresholds
    # parser.add_argument('--catalog-path', help='Override path to Patriot catalog CSV')
    # parser.add_argument('--config-path', help='Override path to Patriot catalog config JSON')
    # parser.add_argument('--similarity-threshold', type=float, help='Override similarity threshold for matching')

    args = parser.parse_args()

    print(f"[MainAnalytics] Executing action: {args.action}")

    if args.action == 'match_products':
        try:
            print("[MainAnalytics] Initializing ProductMatcher...")
            # Pass overrides if they were added to argparse and provided by user
            # matcher = ProductMatcher(
            #     patriot_catalog_path=args.catalog_path,
            #     patriot_config_path=args.config_path,
            #     similarity_threshold=args.similarity_threshold
            # )
            matcher = ProductMatcher() # Uses defaults or env vars
            print("[MainAnalytics] Starting product matching...")
            matcher.match_all_patriot_products()
            print("[MainAnalytics] Product matching completed.")
        except Exception as e:
            print(f"[MainAnalytics] Error during product matching: {e}")
            import traceback
            traceback.print_exc()

    elif args.action == 'create_views':
        try:
            print("[MainAnalytics] Creating database views...")
            create_price_gaps_view()
            print("[MainAnalytics] Database views creation process completed.")
        except Exception as e:
            print(f"[MainAnalytics] Error creating database views: {e}")
            import traceback
            traceback.print_exc()
    
    else:
        print(f"[MainAnalytics]Unknown action: {args.action}")

if __name__ == "__main__":
    main() 