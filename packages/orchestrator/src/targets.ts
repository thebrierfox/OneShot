import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

export interface Target { vendor: string; sku: string }

/**
 * Load scraping targets from a YAML file (default: config/targets.yaml).
 * If the file is missing or empty it falls back to a minimal seed so the
 * pipeline always has something to do.
 */
export function loadTargets(filePath = path.resolve(process.cwd(), 'config', 'targets.yaml')): Target[] {
  try {
    if (fs.existsSync(filePath)) {
      const doc = YAML.parse(fs.readFileSync(filePath, 'utf8'));
      if (Array.isArray(doc) && doc.length > 0) {
        return doc as Target[];
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[targets] Failed to load ${filePath}:`, err);
  }
  // Fallback
  return [{ vendor: 'sunbelt', sku: '857' }];
}

// ---------------------------------------------------------------------------
// Auto-target generator
// ---------------------------------------------------------------------------

/** CSV helper (very naive – skeleton implementation). */
function readCsv(filePath: string): string[][] {
  if (!fs.existsSync(filePath)) return [];
  return fs
    .readFileSync(filePath, 'utf8')
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(','));
}

/**
 * Build targets by cross-joining Patriot catalogue and sku_map.csv.
 *   patriot_catalog.csv columns: patriot_sku,name,category,price_day,price_week,price_month
 *   sku_map.csv columns: patriot_sku,competitor_id,competitor_sku
 */
export function buildTargetsFromCatalog(): Target[] {
  const catalogPath = path.resolve(process.cwd(), 'config', 'patriot_catalog.csv');
  const mapPath = path.resolve(process.cwd(), 'config', 'sku_map.csv');
  const catalogRows = readCsv(catalogPath);
  const mapRows = readCsv(mapPath);
  if (catalogRows.length === 0 || mapRows.length === 0) {
    console.warn('[targets] patriot_catalog.csv or sku_map.csv missing or empty – falling back to default seed');
    return [{ vendor: 'sunbelt', sku: '857' }];
  }

  const mapByPatriot: Record<string, { vendor: string; sku: string }[]> = {};
  for (const [patriotSku, competitorId, competitorSku] of mapRows.slice(1)) {
    if (!mapByPatriot[patriotSku]) mapByPatriot[patriotSku] = [];
    mapByPatriot[patriotSku].push({ vendor: competitorId, sku: competitorSku });
  }

  const targets: Target[] = [];
  for (const [patriotSku] of catalogRows.slice(1)) {
    const mappings = mapByPatriot[patriotSku];
    if (mappings) targets.push(...mappings);
  }
  return targets.length > 0 ? targets : [{ vendor: 'sunbelt', sku: '857' }];
} 