from psycopg2 import extensions as _psycopg2_extensions # For type hinting connection
from .. import db_utils # Relative import for package structure

def create_price_gaps_view(db_conn: Optional[_psycopg2_extensions.connection] = None) -> None:
    """Creates or replaces the 'price_gaps' view in the PostgreSQL database.

    This view joins Patriot's products with matched competitor products 
    to calculate price differences and percentage gaps for daily, weekly, and monthly rates.

    Args:
        db_conn (Optional[psycopg2.extensions.connection]): 
            An existing database connection. If None, a new connection will be established.
            The function will not close a connection passed to it.
    """
    view_sql = """
    CREATE OR REPLACE VIEW price_gaps AS
    SELECT
        patriot.sku AS patriot_actual_sku, 
        patriot.product_name AS patriot_product_name,
        patriot.day_rate AS patriot_day_rate,
        patriot.week_rate AS patriot_week_rate,
        patriot.month_rate AS patriot_month_rate,
        patriot.currency AS patriot_currency,
        
        competitor.vendor_id AS competitor_vendor_id,
        competitor.product_name AS competitor_product_name,
        competitor.url AS competitor_url,
        competitor.sku AS competitor_actual_sku, -- Competitor's own SKU
        competitor.day_rate AS competitor_day_rate,
        competitor.week_rate AS competitor_week_rate,
        competitor.month_rate AS competitor_month_rate,
        competitor.currency AS competitor_currency,
        
        (competitor.day_rate - patriot.day_rate) AS day_rate_gap,
        CASE 
            WHEN patriot.day_rate IS NOT NULL AND patriot.day_rate != 0 AND competitor.day_rate IS NOT NULL
            THEN ((competitor.day_rate - patriot.day_rate) / patriot.day_rate) * 100
            ELSE NULL 
        END AS day_rate_gap_percent,
        
        (competitor.week_rate - patriot.week_rate) AS week_rate_gap,
        CASE 
            WHEN patriot.week_rate IS NOT NULL AND patriot.week_rate != 0 AND competitor.week_rate IS NOT NULL
            THEN ((competitor.week_rate - patriot.week_rate) / patriot.week_rate) * 100
            ELSE NULL 
        END AS week_rate_gap_percent,
        
        (competitor.month_rate - patriot.month_rate) AS month_rate_gap,
        CASE 
            WHEN patriot.month_rate IS NOT NULL AND patriot.month_rate != 0 AND competitor.month_rate IS NOT NULL
            THEN ((competitor.month_rate - patriot.month_rate) / patriot.month_rate) * 100
            ELSE NULL 
        END AS month_rate_gap_percent,

        competitor.scraped_at AS competitor_scraped_at,
        patriot.id AS patriot_db_id,
        competitor.id AS competitor_db_id
    FROM
        normalized_products AS patriot
    JOIN
        normalized_products AS competitor 
        ON patriot.sku = competitor.patriot_sku 
    WHERE
        patriot.vendor_id = 'patriot' 
        AND competitor.vendor_id != 'patriot'
        AND competitor.patriot_sku IS NOT NULL;
    """
    
    print("[DBViews] Attempting to create or replace 'price_gaps' view...")
    
    manage_connection_locally = False
    if db_conn is None:
        db_conn = db_utils.get_db_connection()
        manage_connection_locally = True
        
    try:
        with db_conn.cursor() as cur:
            cur.execute(view_sql)
        db_conn.commit()
        print("[DBViews] 'price_gaps' view created or replaced successfully.")
    except Exception as e:
        if manage_connection_locally and db_conn:
            db_conn.rollback()
        print(f"[DBViews] Error creating 'price_gaps' view: {e}")
        raise
    finally:
        if manage_connection_locally and db_conn:
            db_conn.close()

if __name__ == '__main__':
    print("[DBViews] Running example: Creating price_gaps view...")
    # This example assumes Postgres is running and normalized_products table exists.
    # Ensure environment variables for DB connection are set in your .env file at project root.
    try:
        # Create the view using a new connection managed by the function
        create_price_gaps_view()
        
        # Example: Optionally, fetch some data from the view to verify
        # This requires the db_utils.fetch_as_dataframe to be accessible and working
        conn = db_utils.get_db_connection()
        try:
            df = db_utils.fetch_as_dataframe("SELECT * FROM price_gaps LIMIT 5;", db_conn=conn) # Pass connection
            if not df.empty:
                print("\n[DBViews] Fetched sample data from 'price_gaps' view:")
                print(df.head())
            else:
                print("\n[DBViews] 'price_gaps' view is empty or no data matched the criteria.")
        except Exception as fetch_e:
            print(f"[DBViews] Error fetching sample data from view: {fetch_e}")
        finally:
            if conn:
                conn.close()
                
        print("\n[DBViews] Example completed successfully.")
    except Exception as e:
        print(f"[DBViews] Example usage failed: {e}") 