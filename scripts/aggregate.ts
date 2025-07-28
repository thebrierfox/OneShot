#!/usr/bin/env ts-node
/*
 * Aggregates the latest CSV reports from each vendor into a single
 * `aggregate/latest-full-variance.csv`. Uses fast-glob to discover the
 * latest `5-report.csv` in each `playbooks/<vendor>/runs/<timestamp>/` folder.
 */

import fg from 'fast-glob';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import fs from 'fs';

async function aggregate() {
  // Find all report CSVs
  const allReports = fg.sync('playbooks/*/runs/*/5-report.csv', { onlyFiles: true });
  // Map vendor → latest run path
  const latestReports: Record<string, string> = {};
  for (const p of allReports) {
    const parts = p.split('/');
    const vendor = parts[1];
    const runId = parts[3];
    if (!latestReports[vendor] || runId > latestReports[vendor]) {
      latestReports[vendor] = p;
    }
  }
  // Parse rows
  const rows: any[] = [];
  for (const p of Object.values(latestReports)) {
    const csv = fs.readFileSync(p, 'utf8');
    const parsed = parse(csv, { columns: true });
    rows.push(...parsed);
  }
  // Write aggregated CSV
  const output = stringify(rows, { header: true });
  fs.mkdirSync('aggregate', { recursive: true });
  fs.writeFileSync('aggregate/latest-full-variance.csv', output);
  console.log(`Aggregated ${rows.length} rows from ${Object.keys(latestReports).length} vendors.`);
}

aggregate().catch((err) => {
  console.error(err);
  process.exit(1);
});