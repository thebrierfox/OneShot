import fs from 'fs-extra';
import path from 'path';
import { loadTargets } from '@patriot-rentals/orchestrator/dist/targets';

export async function runLocalPipeline(): Promise<string> {
  const targets = loadTargets();
  const outDir = path.resolve(process.cwd(), 'reports');
  await fs.ensureDir(outDir);
  const filePath = path.join(outDir, `price-gap-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`);
  const header = 'vendor,sku,price_day,price_week,price_month\n';
  const rows = targets.map((t: any) => `${t.vendor},${t.sku},,,`).join('\n');
  await fs.writeFile(filePath, header + rows);
  return filePath;
} 