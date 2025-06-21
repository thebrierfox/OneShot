export interface Target {
    vendor: string;
    sku: string;
}
/**
 * Load scraping targets from a YAML file (default: config/targets.yaml).
 * If the file is missing or empty it falls back to a minimal seed so the
 * pipeline always has something to do.
 */
export declare function loadTargets(filePath?: string): Target[];
/**
 * Build targets by cross-joining Patriot catalogue and sku_map.csv.
 *   patriot_catalog.csv columns: patriot_sku,name,category,price_day,price_week,price_month
 *   sku_map.csv columns: patriot_sku,competitor_id,competitor_sku
 */
export declare function buildTargetsFromCatalog(): Target[];
