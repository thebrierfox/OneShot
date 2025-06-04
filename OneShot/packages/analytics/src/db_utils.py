import os
import psycopg2
import pandas as pd
from dotenv import load_dotenv
from typing import Optional, Any, List, Dict

load_dotenv()

def get_db_connection():
    """Establishes a connection to the PostgreSQL database using environment variables.

    Returns:
        psycopg2.connection: Database connection object.

    Raises:
        Exception: If database connection fails or required environment variables are missing.
    """
    try:
        conn = psycopg2.connect(
            dbname=os.getenv("POSTGRES_DB"),
            user=os.getenv("POSTGRES_USER"),
            password=os.getenv("POSTGRES_PASSWORD"),
            host=os.getenv("POSTGRES_HOST", "localhost"), # Default to localhost if not set
            port=os.getenv("POSTGRES_PORT", "5432")      # Default to 5432 if not set
        )
        return conn
    except Exception as e:
        print(f"[DBUtils] Error connecting to PostgreSQL: {e}")
        raise

def execute_query(query: str, params: Optional[tuple] = None, fetch_one: bool = False, fetch_all: bool = False) -> Optional[Any]:
    """Executes a SQL query and optionally fetches results.

    Args:
        query (str): The SQL query to execute.
        params (Optional[tuple]): Parameters to pass to the query. Defaults to None.
        fetch_one (bool): If True, fetches a single row. Defaults to False.
        fetch_all (bool): If True, fetches all rows. Defaults to False.

    Returns:
        Optional[Any]: Query result if fetch_one or fetch_all is True, otherwise None.
                       Returns a single tuple for fetch_one, list of tuples for fetch_all.

    Raises:
        Exception: If query execution fails.
    """
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(query, params)
            conn.commit() # Commit changes for INSERT, UPDATE, DELETE
            
            if fetch_one:
                return cur.fetchone()
            if fetch_all:
                return cur.fetchall()
        return None
    except Exception as e:
        if conn:
            conn.rollback() # Rollback on error
        print(f"[DBUtils] Error executing query \"{query[:100]}...\": {e}")
        raise
    finally:
        if conn:
            conn.close()

def fetch_as_dataframe(query: str, params: Optional[tuple] = None) -> pd.DataFrame:
    """Executes a SQL query and returns the result as a Pandas DataFrame.

    Args:
        query (str): The SQL query to execute.
        params (Optional[tuple]): Parameters to pass to the query. Defaults to None.

    Returns:
        pd.DataFrame: DataFrame containing the query result.

    Raises:
        Exception: If query execution fails or DataFrame creation fails.
    """
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(query, params)
            colnames = [desc[0] for desc in cur.description]
            results = cur.fetchall()
            df = pd.DataFrame(results, columns=colnames)
            return df
    except Exception as e:
        print(f"[DBUtils] Error fetching data as DataFrame for query \"{query[:100]}...\": {e}")
        raise
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    # Example Usage (requires a running Postgres instance with data)
    print("[DBUtils] Running example usage...")
    try:
        # Create a dummy table and insert data for testing
        execute_query("""
            CREATE TABLE IF NOT EXISTS test_table (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100),
                value INTEGER
            );
        """)
        execute_query("INSERT INTO test_table (name, value) VALUES (%s, %s) ON CONFLICT (id) DO NOTHING;", ("Test Item 1", 100))
        execute_query("INSERT INTO test_table (name, value) VALUES (%s, %s) ON CONFLICT (id) DO NOTHING;", ("Test Item 2", 200))
        
        print("Fetching one row:")
        row = execute_query("SELECT * FROM test_table WHERE name = %s;", ("Test Item 1",), fetch_one=True)
        print(row)

        print("\nFetching all rows:")
        rows = execute_query("SELECT * FROM test_table;", fetch_all=True)
        for r in rows:
            print(r)

        print("\nFetching as DataFrame:")
        df = fetch_as_dataframe("SELECT * FROM test_table;")
        print(df.head())

        print("\nCleaning up test table...")
        execute_query("DROP TABLE IF EXISTS test_table;")
        print("[DBUtils] Example usage completed successfully.")

    except Exception as e:
        print(f"[DBUtils] Example usage failed: {e}") 