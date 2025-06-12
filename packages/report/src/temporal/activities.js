"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeCsvReport = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const date_fns_1 = require("date-fns");
async function writeCsvReport(cleaned) {
    const dateStr = (0, date_fns_1.format)(new Date(), 'yyyyMMdd');
    const outputDir = path_1.default.resolve('/output');
    await fs_extra_1.default.ensureDir(outputDir);
    const filePath = path_1.default.join(outputDir, `report-${dateStr}.csv`);
    const header = 'name,price,sku,vendor';
    const rows = cleaned.map((p) => `${p.name},${p.price},${p.sku},${p.vendor}`);
    const csv = [header, ...rows].join('\n');
    await fs_extra_1.default.writeFile(filePath, csv, 'utf8');
    return filePath;
}
exports.writeCsvReport = writeCsvReport;
//# sourceMappingURL=activities.js.map