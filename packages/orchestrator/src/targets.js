"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTargetsFromCatalog = exports.loadTargets = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const yaml_1 = __importDefault(require("yaml"));
/**
 * Load scraping targets from a YAML file (default: config/targets.yaml).
 * If the file is missing or empty it falls back to a minimal seed so the
 * pipeline always has something to do.
 */
function loadTargets(filePath = path_1.default.resolve(process.cwd(), 'config', 'targets.yaml')) {
    try {
        if (fs_1.default.existsSync(filePath)) {
            const doc = yaml_1.default.parse(fs_1.default.readFileSync(filePath, 'utf8'));
            if (Array.isArray(doc) && doc.length > 0) {
                return doc;
            }
        }
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.warn(`[targets] Failed to load ${filePath}:`, err);
    }
    // Fallback
    return [{ vendor: 'sunbelt', sku: '857' }];
}
exports.loadTargets = loadTargets;
// ---------------------------------------------------------------------------
// Auto-target generator
// ---------------------------------------------------------------------------
/** CSV helper (very naive – skeleton implementation). */
function readCsv(filePath) {
    if (!fs_1.default.existsSync(filePath))
        return [];
    return fs_1.default
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
function buildTargetsFromCatalog() {
    const catalogPath = path_1.default.resolve(process.cwd(), 'config', 'patriot_catalog.csv');
    const mapPath = path_1.default.resolve(process.cwd(), 'config', 'sku_map.csv');
    const catalogRows = readCsv(catalogPath);
    const mapRows = readCsv(mapPath);
    if (catalogRows.length === 0 || mapRows.length === 0) {
        console.warn('[targets] patriot_catalog.csv or sku_map.csv missing or empty – falling back to default seed');
        return [{ vendor: 'sunbelt', sku: '857' }];
    }
    const mapByPatriot = {};
    for (const [patriotSku, competitorId, competitorSku] of mapRows.slice(1)) {
        if (!mapByPatriot[patriotSku])
            mapByPatriot[patriotSku] = [];
        mapByPatriot[patriotSku].push({ vendor: competitorId, sku: competitorSku });
    }
    const targets = [];
    for (const [patriotSku] of catalogRows.slice(1)) {
        const mappings = mapByPatriot[patriotSku];
        if (mappings)
            targets.push(...mappings);
    }
    return targets.length > 0 ? targets : [{ vendor: 'sunbelt', sku: '857' }];
}
exports.buildTargetsFromCatalog = buildTargetsFromCatalog;
//# sourceMappingURL=targets.js.map