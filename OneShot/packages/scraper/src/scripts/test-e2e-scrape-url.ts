import * as dotenv from 'dotenv';
import { Command } from 'commander';
import { Page } from 'playwright';
import * as cheerio from 'cheerio';
import fs from 'fs-extra';
import path from 'path';
import { launchPlaywright, PlaywrightHandles } from '../../browser/playwright-factory'; // Adjusted path
import { vendorConfigMap } from '../../configs'; // Adjusted path
import type { RawScrapedProduct, VendorConfig, Price, RentalRates } from '@patriot-rentals/shared-types';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') }); // Ensure .env is loaded from project root

const DEBUG_SNAPSHOTS_DIR = process.env.DEBUG_SNAPSHOTS_DIR || './debug_snapshots';
const BROWSERLESS_WS_ENDPOINT = process.env.BROWSERLESS_HOST
  ? `ws://${process.env.BROWSERLESS_HOST}:${process.env.BROWSERLESS_PORT || 3000}?token=${process.env.BROWSERLESS_TOKEN || 'localtoken'}`
  : process.env.BROWSERLESS_WS_ENDPOINT;

// Duplicating these from activities.ts for standalone script execution
// In a real scenario, you might refactor them into a shared util if they become more complex
async function autoScroll(page: Page): Promise<void> {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight - window.innerHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }

function extractPriceValue(text: string | null | undefined, vendorConfig: VendorConfig): number | null {
    if (!text) return null;
    const { currencySymbol = '$', decimalSeparator = '.', thousandSeparator = ',' } = vendorConfig.rateParsingConfig || {};
    let cleanedText = text.replace(new RegExp(`\${currencySymbol}`, 'g'), '');
    cleanedText = cleanedText.replace(new RegExp(`\${thousandSeparator}`, 'g'), '');
    if (decimalSeparator !== '.') {
      cleanedText = cleanedText.replace(new RegExp(`\${decimalSeparator}`, 'g'), '.');
    }
    const match = cleanedText.match(/\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : null;
}

/**
 * Test wrapper for the core logic of scrapeProductPageActivity.
 * This function simulates the activity's scraping logic without Temporal context.
 */
async function testScrapeProductPage(
  url: string,
  vendorId: string
): Promise<RawScrapedProduct> {
  console.log(`[TestScript] Starting scrape for URL: ${url}, Vendor ID: ${vendorId}`);
  const vendorConfig = vendorConfigMap[vendorId];
  if (!vendorConfig) {
    throw new Error(`[TestScript] No vendor configuration found for vendorId: ${vendorId}`);
  }

  if (!BROWSERLESS_WS_ENDPOINT) {
    throw new Error('[TestScript] BROWSERLESS_WS_ENDPOINT is not configured.');
  }

  const result: RawScrapedProduct = {
    vendorId,
    url,
    scrapedAt: new Date().toISOString(),
    productName: null, rates: {}, sku: null, description: null, imageUrl: null, category: null,
    error: null, httpStatus: null,
  };

  let playwrightHandles: PlaywrightHandles | undefined;

  try {
    playwrightHandles = await launchPlaywright({
      browserlessWsEndpoint: BROWSERLESS_WS_ENDPOINT,
      contextOptions: vendorConfig.playwrightContextOptions,
      proxyServer: process.env.HTTP_PROXY_STRING || undefined,
    });
    const { page } = playwrightHandles;
    result.httpStatus = (await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })).status();
    console.log(`[TestScript] Page loaded with status: ${result.httpStatus}`);

    if (vendorConfig.networkIntercepts && vendorConfig.networkIntercepts.length > 0) {
      page.on('response', async (response) => {
        for (const intercept of vendorConfig.networkIntercepts!) {
          if (new RegExp(intercept.urlPattern).test(response.url()) && (!intercept.resourceType || response.request().resourceType() === intercept.resourceType)) {
            try {
              const json = await response.json();
              result.networkJsonPayload = json;
              if (intercept.pricePaths.productName && json[intercept.pricePaths.productName]) result.productName = String(json[intercept.pricePaths.productName]);
              if (intercept.pricePaths.sku && json[intercept.pricePaths.sku]) result.sku = String(json[intercept.pricePaths.sku]);
              const rates: RentalRates = result.rates || {};
              let currency: string | undefined;
              if (intercept.pricePaths.currency) {
                if (json[intercept.pricePaths.currency]) currency = String(json[intercept.pricePaths.currency]);
                else if (!Object.keys(json).includes(intercept.pricePaths.currency) && /^[A-Z]{3}$/.test(intercept.pricePaths.currency)) currency = intercept.pricePaths.currency;
              }
              if(!currency) currency = vendorConfig.rateParsingConfig?.currencySymbol === '$' ? 'USD' : undefined;
              if (intercept.pricePaths.day) {
                const dayPriceText = json[intercept.pricePaths.day];
                const amount = typeof dayPriceText === 'number' ? dayPriceText : extractPriceValue(String(dayPriceText), vendorConfig);
                if (amount !== null && currency) rates.perDay = { amount, currency };
              }
              if (intercept.pricePaths.week) {
                const weekPriceText = json[intercept.pricePaths.week];
                const amount = typeof weekPriceText === 'number' ? weekPriceText : extractPriceValue(String(weekPriceText), vendorConfig);
                if (amount !== null && currency) rates.perWeek = { amount, currency };
              }
              if (intercept.pricePaths.month) {
                const monthPriceText = json[intercept.pricePaths.month];
                const amount = typeof monthPriceText === 'number' ? monthPriceText : extractPriceValue(String(monthPriceText), vendorConfig);
                if (amount !== null && currency) rates.perMonth = { amount, currency };
              }
              if(Object.keys(rates).length > 0) result.rates = rates;
              break;
            } catch (e) { console.warn(`[TestScript] Error processing network intercept for ${response.url()}: ${e instanceof Error ? e.message : String(e)}`); }
          }
        }
      });
    }

    await autoScroll(page);
    const htmlContent = await page.content();
    const $ = cheerio.load(htmlContent);
    const extract = (selector: string): string | null => {
      if (!selector) return null;
      const [sel, attr] = selector.split('::attr(');
      return attr ? ($(sel).attr(attr.slice(0, -1))?.trim() || null) : ($(sel).first().text()?.trim() || null);
    };
    if (!result.productName) result.productName = extract(vendorConfig.selectors.productName);
    if (!result.sku) result.sku = extract(vendorConfig.selectors.sku);
    if (!result.description) result.description = extract(vendorConfig.selectors.description);
    if (!result.imageUrl) result.imageUrl = extract(vendorConfig.selectors.imageUrl);
    if (!result.category) result.category = extract(vendorConfig.selectors.category);
    const ratesFromSelectors: RentalRates = result.rates || {};
    let currencyFromSelectors: string | undefined = vendorConfig.rateParsingConfig?.currencySymbol === '$' ? 'USD' : undefined;
    if (!ratesFromSelectors.perDay && vendorConfig.selectors.priceDay) {
      const amount = extractPriceValue(extract(vendorConfig.selectors.priceDay), vendorConfig);
      if (amount !== null && currencyFromSelectors) ratesFromSelectors.perDay = { amount, currency: currencyFromSelectors };
    }
    if (!ratesFromSelectors.perWeek && vendorConfig.selectors.priceWeek) {
      const amount = extractPriceValue(extract(vendorConfig.selectors.priceWeek), vendorConfig);
      if (amount !== null && currencyFromSelectors) ratesFromSelectors.perWeek = { amount, currency: currencyFromSelectors };
    }
    if (!ratesFromSelectors.perMonth && vendorConfig.selectors.priceMonth) {
      const amount = extractPriceValue(extract(vendorConfig.selectors.priceMonth), vendorConfig);
      if (amount !== null && currencyFromSelectors) ratesFromSelectors.perMonth = { amount, currency: currencyFromSelectors };
    }
    if(Object.keys(ratesFromSelectors).length > 0) result.rates = ratesFromSelectors;

    if (vendorConfig.customParser) {
      try {
        const customParserFunc = new Function('initialData', 'page', 'cheerioPage', `return (${vendorConfig.customParser})(initialData, page, cheerioPage)`);
        const customData = await customParserFunc(result, page, $);
        Object.assign(result, customData);
      } catch (e) {
        console.error(`[TestScript] Error in custom parser for ${url}: ${e instanceof Error ? e.message : String(e)}`);
        result.error = `Custom parser error: ${e instanceof Error ? e.message : String(e)}`;
      }
    }
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    console.error(`[TestScript] Error scraping ${url} for vendor ${vendorId}: ${error.message}`);
    result.error = error.message;
    if (playwrightHandles) {
      const { page } = playwrightHandles;
      try {
        const snapshotDir = path.join(DEBUG_SNAPSHOTS_DIR, vendorId, new URL(url).hostname, new Date().toISOString().replace(/[:.]/g, '-'));
        await fs.ensureDir(snapshotDir);
        const htmlPath = path.join(snapshotDir, 'page.html');
        const screenshotPath = path.join(snapshotDir, 'screenshot.png');
        const htmlContentOnError = await page.content().catch(() => 'Error fetching HTML content.');
        await fs.writeFile(htmlPath, htmlContentOnError);
        await page.screenshot({ path: screenshotPath, fullPage: true }).catch(err => console.error('[TestScript] Failed to take screenshot:', err));
        console.log(`[TestScript] Debug snapshot saved to ${snapshotDir}`);
        result.rawHtmlContent = `Error snapshot saved to: ${snapshotDir}`;
      } catch (snapshotError) {
        console.error(`[TestScript] Failed to save debug snapshot: ${snapshotError instanceof Error ? snapshotError.message : String(snapshotError)}`);
        result.rawHtmlContent = 'Failed to save error snapshot.';
      }
    }
  } finally {
    if (playwrightHandles) {
      await playwrightHandles.browser.close().catch(err => console.error('[TestScript] Error closing browser:', err));
    }
  }
  return result;
}

async function main() {
  const program = new Command();
  program
    .requiredOption('-v, --vendor-id <id>', 'Vendor ID (e.g., sunbelt, unitedrentals)')
    .requiredOption('-u, --url <url>', 'Full URL to scrape')
    .parse(process.argv);

  const options = program.opts();
  console.log('[TestScript] Running with options:', options);

  try {
    const scrapedData = await testScrapeProductPage(options.url, options.vendorId);
    console.log('[TestScript] Scraping complete. Result:');
    console.log(JSON.stringify(scrapedData, null, 2));
    if (scrapedData.error) {
        process.exitCode = 1; // Indicate failure
    }
  } catch (error) {
    console.error('[TestScript] Critical error during script execution:', error);
    process.exit(1);
  }
}

main(); 