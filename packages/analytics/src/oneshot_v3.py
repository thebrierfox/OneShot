"""
OneShot v3 Price Variance pipeline.

This script loads the Patriot Equipment Rentals catalog and competitor price data, computes price differences, flags alerts, and outputs JSON/CSV reports.

Usage:
  python oneshot_v3.py --catalog ./config/patriot_catalog.csv \
    --competitor path/to/sunbelt_prices.csv \
    --competitor path/to/others.json \
    --output-dir ./data/output
"""
import argparse
import os
import json
import datetime

import pandas as pd


def load_per_inventory(csv_path: str) -> pd.DataFrame:
    """Load Patriot catalog CSV and normalize column names."""
    df = pd.read_csv(csv_path)
    # Normalize SKU column name
    if 'patriot_sku' not in df.columns:
        # attempt to detect SKU-like column
        for col in df.columns:
            if col.lower() in {'sku', 'patriot sku', 'skucolumnname', 'patriot_sku'}:
                df = df.rename(columns={col: 'patriot_sku'})
                break
    # Normalize price_day column name
    if 'price_day' not in df.columns:
        for col in df.columns:
            if col.lower().replace(' ', '').replace('_','') in {'dailyrate','price_day','priceday','daily_rate'}:
                df = df.rename(columns={col: 'price_day'})
                break
    return df


def load_competitor_prices(paths: list) -> pd.DataFrame:
    """Load competitor price sheets from CSV or JSON into a single DataFrame."""
    frames = []
    for path in paths:
        ext = os.path.splitext(path)[1].lower()
        try:
            if ext == '.csv':
                df = pd.read_csv(path)
            elif ext == '.json':
                with open(path) as f:
                    data = json.load(f)
                df = pd.DataFrame(data)
            else:
                print(f"Skipping unsupported file type: {path}")
                continue
        except Exception as e:
            print(f"Error loading competitor file {path}: {e}")
            continue
        # Rename SKU column
        if 'patriot_sku' not in df.columns:
            if 'sku' in df.columns:
                df = df.rename(columns={'sku': 'patriot_sku'})
            elif 'patriotSku' in df.columns:
                df = df.rename(columns={'patriotSku': 'patriot_sku'})
        # Rename price column
        if 'competitor_price' not in df.columns:
            for c in df.columns:
                if c.lower().replace(' ', '').replace('_','') in {'price','price_day','daily_rate','rate','competitorprice'}:
                    df = df.rename(columns={c: 'competitor_price'})
                    break
        # Fill competitor name from filename if missing
        if 'competitor' not in df.columns:
            df['competitor'] = os.path.splitext(os.path.basename(path))[0]
        frames.append(df)
    if frames:
        return pd.concat(frames, ignore_index=True)
    else:
        return pd.DataFrame(columns=['patriot_sku','competitor_price','competitor'])


def match_and_merge(per_df: pd.DataFrame, comp_df: pd.DataFrame) -> pd.DataFrame:
    """Merge Patriot and competitor DataFrames on patriot_sku and compute deltas."""
    merged = per_df.merge(comp_df, on='patriot_sku', how='left', suffixes=('', '_comp'))
    merged['diff_abs'] = merged['competitor_price'] - merged['price_day']
    merged['diff_pct'] = merged['diff_abs'] / merged['price_day'] * 100
    merged['alert_flag'] = merged['diff_pct'].abs() >= 15
    return merged


def generate_reports(merged_df: pd.DataFrame, date_str: str, output_dir: str) -> None:
    """Generate raw_prices.json, price_delta.json and report.csv files."""
    raw_prices = []
    price_delta = []
    for _, row in merged_df.iterrows():
        raw_prices.append({
            'date': date_str,
            'sku': row['patriot_sku'],
            'patriot_price': row['price_day'],
            'competitor': row.get('competitor'),
            'competitor_price': row.get('competitor_price'),
            'url': row.get('url'),
            'scrape_status': row.get('scrape_status', 'ok')
        })
        price_delta.append({
            'sku': row['patriot_sku'],
            'name': row.get('name'),
            'patriot_price': row['price_day'],
            'competitor_price': row.get('competitor_price'),
            'diff_abs': row.get('diff_abs'),
            'diff_pct': row.get('diff_pct'),
            'alert': bool(row.get('alert_flag'))
        })
    os.makedirs(output_dir, exist_ok=True)
    with open(os.path.join(output_dir, 'raw_prices.json'), 'w') as f:
        json.dump(raw_prices, f, indent=2)
    with open(os.path.join(output_dir, 'price_delta.json'), 'w') as f:
        json.dump(price_delta, f, indent=2)
    merged_df[['patriot_sku','name','price_day','competitor','competitor_price','diff_abs','diff_pct','alert_flag']].to_csv(
        os.path.join(output_dir, 'report.csv'), index=False
    )


def main():
    parser = argparse.ArgumentParser(description='OneShot v3 Price Variance Report Generator')
    parser.add_argument('--catalog', default='./config/patriot_catalog.csv',
                        help='Path to Patriot catalog CSV')
    parser.add_argument('--competitor', action='append', default=[],
                        help='Path to competitor price file (CSV or JSON). Can be specified multiple times.')
    parser.add_argument('--output-dir', default='./data/output',
                        help='Directory to write output reports')
    args = parser.parse_args()

    per_df = load_per_inventory(args.catalog)
    comp_df = load_competitor_prices(args.competitor)
    merged = match_and_merge(per_df, comp_df)
    date_str = datetime.date.today().isoformat()
    generate_reports(merged, date_str, args.output_dir)
    print(f"Generated reports in {args.output_dir}")


if __name__ == '__main__':
    main()
