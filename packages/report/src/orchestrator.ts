import { ReportGenerationOrchestratorInput, VendorConfig } from '@patriot-rentals/shared-types';
import { Connection, Client } from '@temporalio/client';
import { runCrawlers } from '@patriot-rentals/crawler'; 
import { vendorConfigMap } from '@patriot-rentals/scraper/src/configs';
import { execSync } from 'child_process';
import { generateMarkdownReport } from './services/markdown.service';
import { fetchReportData } from './services/postgres.service';
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const projectRoot = path.resolve(__dirname, '../../../');

interface InitialCompetitorsConfig {
  vendors: string[];
}

interface ReportViewData {
  patriot_actual_sku: string;
  patriot_product_name: string;
  patriot_day_rate: number | null;
  competitor_vendor_id: string;
  competitor_product_name: string;
  competitor_url: string;
  competitor_day_rate: number | null;
  day_rate_gap_percent: number | null;
  // Add other fields from price_gaps view as needed
}

interface TransformedReportData {
  summary: {
    totalMatchedProducts: number;
    competitorsAnalyzedCount: number;
  };
  underPricedItems: Array<{[key: string]: any}>; // Define more specific type if possible
  overPricedItems: Array<{[key: string]: any}>;
  noMatchItems: Array<{[key: string]: any}>; // Will be empty for now
  suggestedActions: Array<{[key: string]: any}>; // Will be empty for now
}

function transformPriceGapsData(priceGapsData: ReportViewData[]): TransformedReportData {
  const patriotProductsMap = new Map<string, { 
    name: string; 
    dayRate: number | null; 
    competitors: Array<{vendorId: string, dayRate: number | null, gapPercent: number | null}>
  }>();

  for (const row of priceGapsData) {
    if (!patriotProductsMap.has(row.patriot_actual_sku)) {
      patriotProductsMap.set(row.patriot_actual_sku, {
        name: row.patriot_product_name,
        dayRate: row.patriot_day_rate,
        competitors: [],
      });
    }
    patriotProductsMap.get(row.patriot_actual_sku)!.competitors.push({
      vendorId: row.competitor_vendor_id,
      dayRate: row.competitor_day_rate,
      gapPercent: row.day_rate_gap_percent,
    });
  }

  const underPricedItems: Array<{[key: string]: any}> = [];
  const overPricedItems: Array<{[key: string]: any}> = [];
  const uniqueCompetitors = new Set<string>();

  priceGapsData.forEach(row => uniqueCompetitors.add(row.competitor_vendor_id));

  patriotProductsMap.forEach((product, sku) => {
    if (product.dayRate !== null && product.dayRate > 0) {
      const validCompetitorRates = product.competitors
        .map(c => c.dayRate)
        .filter(r => r !== null && r > 0) as number[];
      
      if (validCompetitorRates.length > 0) {
        const avgCompetitorDayRate = validCompetitorRates.reduce((sum, rate) => sum + rate, 0) / validCompetitorRates.length;
        const gapPercent = ((avgCompetitorDayRate - product.dayRate) / product.dayRate) * 100;

        const itemDetail = {
          patriotSku: sku,
          patriotProductName: product.name,
          patriotDayRate: product.dayRate.toFixed(2),
          avgCompetitorDayRate: avgCompetitorDayRate.toFixed(2),
          gapPercent: gapPercent.toFixed(2),
        };

        if (gapPercent < 0) { // Patriot is cheaper
          underPricedItems.push(itemDetail);
        } else if (gapPercent > 0) { // Patriot is more expensive
          overPricedItems.push(itemDetail);
        }
      }
    }
  });

  // Sort by absolute gap percentage (descending for overPriced, ascending for underPriced indirectly)
  underPricedItems.sort((a, b) => parseFloat(a.gapPercent) - parseFloat(b.gapPercent)); // Most underpriced first
  overPricedItems.sort((a, b) => parseFloat(b.gapPercent) - parseFloat(a.gapPercent)); // Most overpriced first

  return {
    summary: {
      totalMatchedProducts: patriotProductsMap.size,
      competitorsAnalyzedCount: uniqueCompetitors.size,
    },
    underPricedItems: underPricedItems.slice(0, 10), // Top 10
    overPricedItems: overPricedItems.slice(0, 10),   // Top 10
    noMatchItems: [], // Placeholder
    suggestedActions: [], // Placeholder
  };
}

export async function runFullReportPipeline(input: ReportGenerationOrchestratorInput): Promise<string> {
  console.log('[Orchestrator] Starting full report pipeline...', input);
  dotenv.config({ path: path.resolve(projectRoot, '.env') }); // Ensure .env is loaded relative to project root

  const reportsOutputDir = path.resolve(projectRoot, process.env.REPORTS_OUTPUT_DIR || './reports');
  await fs.ensureDir(reportsOutputDir);
  console.log(`[Orchestrator] Reports will be saved to: ${reportsOutputDir}`);

  const temporalAddress = process.env.TEMPORAL_ADDRESS!;
  const temporalNamespace = process.env.TEMPORAL_NAMESPACE || 'default';

  console.log(`[Orchestrator] Connecting to Temporal: ${temporalAddress}, namespace: ${temporalNamespace}`);
  const connection = await Connection.connect({ address: temporalAddress });
  const temporalClient = new Client({ connection, namespace: temporalNamespace });
  console.log('[Orchestrator] Temporal client connected.');

  if (!input.skipCrawling) {
    console.log('[Orchestrator] Starting crawling phase...');
    let vendorIdsToProcess: string[] = [];

    if (input.vendorIdsToProcess && input.vendorIdsToProcess.length > 0) {
      vendorIdsToProcess = input.vendorIdsToProcess;
    } else if (process.env.VENDOR_IDS_TO_PROCESS) {
      vendorIdsToProcess = process.env.VENDOR_IDS_TO_PROCESS.split(',').map(id => id.trim());
    } else {
      try {
        const initialCompetitorsPath = path.resolve(projectRoot, 'config', 'initial_competitors_to_process.json');
        console.log(`[Orchestrator] Loading initial competitors from: ${initialCompetitorsPath}`);
        const configContent = await fs.readJson(initialCompetitorsPath) as InitialCompetitorsConfig;
        vendorIdsToProcess = configContent.vendors;
      } catch (e: any) {
        console.error('[Orchestrator] Failed to load initial_competitors_to_process.json:', e.message);
        console.warn('[Orchestrator] Proceeding without initial competitor list for crawling.');
        vendorIdsToProcess = []; // Or all known if that's desired
      }
    }
    console.log(`[Orchestrator] Vendor IDs to process for crawling: ${vendorIdsToProcess.join(', ')}`);

    const selectedVendorConfigs: VendorConfig[] = vendorIdsToProcess
      .map(id => vendorConfigMap[id])
      .filter(config => !!config);

    if (selectedVendorConfigs.length > 0) {
      console.log(`[Orchestrator] Running crawlers for: ${selectedVendorConfigs.map(v => v.displayName).join(', ')}`);
      await runCrawlers(selectedVendorConfigs, temporalClient, { forceRecrawlAll: input.forceRecrawlAll });
      console.log('[Orchestrator] Crawling phase completed.');
    } else {
      console.log('[Orchestrator] No valid vendor configurations found for crawling. Skipping crawl phase.');
    }
  } else {
    console.log('[Orchestrator] Skipping crawling phase as per input.');
  }

  if (!input.skipMatching) {
    console.log('[Orchestrator] Starting matching phase...');
    try {
      console.log('[Orchestrator] Running product matching script...');
      execSync('pnpm --filter @patriot-rentals/analytics match-products', { stdio: 'inherit', cwd: projectRoot });
      console.log('[Orchestrator] Product matching script completed.');

      console.log('[Orchestrator] Running create views script...');
      execSync('pnpm --filter @patriot-rentals/analytics create-views', { stdio: 'inherit', cwd: projectRoot });
      console.log('[Orchestrator] Create views script completed.');
      console.log('[Orchestrator] Matching phase completed.');
    } catch (error) {
      console.error('[Orchestrator] Error during matching phase:', error);
      // Decide if pipeline should stop or continue if matching fails
    }
  } else {
    console.log('[Orchestrator] Skipping matching phase as per input.');
  }

  console.log('[Orchestrator] Fetching report data from database...');
  const rawReportDbData = await fetchReportData() as ReportViewData[];
  console.log(`[Orchestrator] Fetched ${rawReportDbData.length} rows for the report.`);
  
  console.log('[Orchestrator] Transforming data for the report template...');
  const transformedData = transformPriceGapsData(rawReportDbData);

  console.log('[Orchestrator] Generating markdown report...');
  const markdownContent = await generateMarkdownReport(transformedData);

  const reportFileName = `competitor-price-gap-report-${new Date().toISOString().split('T')[0]}.md`;
  const reportPath = path.join(reportsOutputDir, reportFileName);

  console.log(`[Orchestrator] Saving report to: ${reportPath}`);
  await fs.writeFile(reportPath, markdownContent);

  console.log(`[Orchestrator] Full report pipeline completed. Report saved to: ${reportPath}`);
  return reportPath;
} 