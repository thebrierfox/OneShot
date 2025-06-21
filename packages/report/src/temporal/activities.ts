import fs from 'fs-extra';
import path from 'path';
import { format } from 'date-fns';

export async function writeCsvReport(cleaned: any[]): Promise<string> {
  const dateStr = format(new Date(), 'yyyyMMdd-HHmmss');
  const outputDir = path.resolve(process.env.REPORT_OUTPUT_DIR || path.join(process.cwd(), 'output'));
  await fs.ensureDir(outputDir);
  const filePath = path.join(outputDir, `report-${dateStr}.csv`);
  const header = 'name,price,sku,vendor';
  const rows = cleaned.map((p: any) => `${p.name},${p.price},${p.sku},${p.vendor}`);
  const csv = [header, ...rows].join('\n');
  await fs.writeFile(filePath, csv, 'utf8');
  return filePath;
} 