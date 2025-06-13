import { Command } from 'commander';
import { runFullReportPipeline } from './orchestrator';
import { ReportGenerationOrchestratorInput } from '@patriot-rentals/shared-types';
import path from 'path';
import dotenv from 'dotenv';

// Load .env from project root as this script is the entry point for `pnpm generate-report`
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const program = new Command();

interface CliOptions {
  vendors?: string;
  forceRecrawlAll: boolean;
  forceRescrapeFound: boolean;
  skipCrawling: boolean;
  skipMatching: boolean;
  local: boolean;
  autoTargets: boolean;
}

program
  .name('patriot-report-generator')
  .description('Generates a competitor price gap analysis report.')
  .option(
    '--vendors <ids>',
    'Comma-separated list of vendor IDs to process (e.g., sunbelt,unitedrentals). Overrides .env and initial_competitors.json'
  )
  .option('--force-recrawl-all', 'Force re-crawling and re-scraping of all target URLs.', false)
  .option('--force-rescrape-found', 'Force re-scraping of URLs found by crawler, even if recently scraped.', false)
  .option('--skip-crawling', 'Skip crawling, re-process existing data.', false)
  .option('--skip-matching', 'Skip the SKU matching phase.', false)
  .option('--local', 'Run scraper/ETL/report in-process without Temporal', false)
  .option('--auto-targets', 'Rebuild targets.yaml from patriot_catalog.csv + sku_map.csv', false)
  .action(async (cliOptions: CliOptions & { local: boolean }) => {
    const orchestratorInput: ReportGenerationOrchestratorInput = {
      vendorIdsToProcess: cliOptions.vendors ? cliOptions.vendors.split(',').map((id: string) => id.trim()) : undefined,
      forceRecrawlAll: cliOptions.forceRecrawlAll,
      forceRescrapeFound: cliOptions.forceRescrapeFound,
      skipCrawling: cliOptions.skipCrawling,
      skipMatching: cliOptions.skipMatching,
    };

    console.log('[CLI] Starting report generation with options:', orchestratorInput);
    try {
      // If auto-targets requested, regenerate targets.yaml first
      if (cliOptions.autoTargets) {
        const { buildTargetsFromCatalog } = await import('../../orchestrator/src/targets');
        const yaml = await import('yaml');
        const fs = await import('fs');
        const path = await import('path');
        const targets = buildTargetsFromCatalog();
        const yamlText = yaml.stringify(targets);
        fs.writeFileSync(path.resolve(process.cwd(), 'config', 'targets.yaml'), yamlText);
        console.log(`[CLI] targets.yaml updated with ${targets.length} entries`);
      }

      const reportPath = cliOptions.local
        ? await (await import('./local-run')).runLocalPipeline()
        : await runFullReportPipeline(orchestratorInput);
      console.log(`[CLI] Report generation successful! Report saved to: ${reportPath}`);
      process.exit(0);
    } catch (error) {
      console.error('[CLI] Report generation failed:', error);
      process.exit(1);
    }
  });

program.parse(process.argv); 