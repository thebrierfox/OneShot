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