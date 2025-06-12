import * as dotenv from 'dotenv';
import * as cheerio from 'cheerio';
import fs from 'fs-extra';
import path from 'path';
import { launchPlaywright, PlaywrightHandles } from '../browser/playwright-factory';
import { vendorConfigMap } from '../configs';
import type { RawScrapedProduct, VendorConfig, Price, RentalRates } from '@patriot-rentals/shared-types';
import { Context } from '@temporalio/activity';
import { safeClick, autoScroll } from '../utils/page.utils';

dotenv.config();

const DEBUG_SNAPSHOTS_DIR = process.env.DEBUG_SNAPSHOTS_DIR || './debug_snapshots';
const BROWSERLESS_WS_ENDPOINT = process.env.BROWSERLESS_HOST 
  ? `ws://${process.env.BROWSERLESS_HOST}:${process.env.BROWSERLESS_PORT || 3000}?token=${process.env.BROWSERLESS_TOKEN || 'localtoken'}`
  : process.env.BROWSERLESS_WS_ENDPOINT; // Allow direct full WS endpoint override

function extractPriceValue(text: string | null | undefined, vendorConfig: VendorConfig): number | null {
  if (!text) return null;
  const { currencySymbol = '$', decimalSeparator = '.', thousandSeparator = ',' } = vendorConfig.rateParsingConfig || {};
  
  // Remove currency symbol and thousand separators
  let cleanedText = text.replace(new RegExp(`\${currencySymbol}`, 'g'), '');
  cleanedText = cleanedText.replace(new RegExp(`\${thousandSeparator}`, 'g'), '');
  
  // Replace decimal separator if it's not a period
  if (decimalSeparator !== '.') {
    cleanedText = cleanedText.replace(new RegExp(`\${decimalSeparator}`, 'g'), '.');
  }
  
  // Extract the first valid number found
  const match = cleanedText.match(/\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
}


export async function scrapeProductPageActivity(url: string, vendorId: string): Promise<RawScrapedProduct> {
  const context = Context.current();
  context.heartbeat('Scraper activity started');

  const vendorConfig = vendorConfigMap[vendorId];
  if (!vendorConfig) {
    throw new Error(`No vendor configuration found for vendorId: ${vendorId}`);
  }

  if (!BROWSERLESS_WS_ENDPOINT) {
    throw new Error('BROWSERLESS_WS_ENDPOINT is not configured. Please set BROWSERLESS_HOST or BROWSERLESS_WS_ENDPOINT in .env');
  }

  const result: RawScrapedProduct = {
    vendorId,
    url,
    scrapedAt: new Date().toISOString(),
    productName: null,
    rates: {},
    sku: null,
    description: null,
    imageUrl: null,
    category: null,
    rawHtmlContent: undefined, // Only populated on error or if specifically needed
    networkJsonPayload: undefined,
    error: null,
    httpStatus: null,
  };

  let playwrightHandles: PlaywrightHandles | undefined;

  try {
    context.heartbeat('Launching Playwright');
    playwrightHandles = await launchPlaywright({
      browserlessWsEndpoint: BROWSERLESS_WS_ENDPOINT,
      contextOptions: vendorConfig.playwrightContextOptions,
      proxyServer: process.env.HTTP_PROXY_STRING || undefined,
    });
    const { page, browser } = playwrightHandles;
    result.httpStatus = (await page.goto(url, { waitUntil: 'networkidle', timeout: vendorConfig.crawlerOptions?.navigationTimeoutSecs ? vendorConfig.crawlerOptions.navigationTimeoutSecs * 1000 : 60000 }) )?.status() || null;
    
    context.heartbeat('Page loaded, starting extraction logic');

    if (vendorConfig.networkIntercepts && vendorConfig.networkIntercepts.length > 0) {
      context.heartbeat('Setting up network intercepts');
      page.on('response', async (response) => {
        for (const intercept of vendorConfig.networkIntercepts!) {
          if (new RegExp(intercept.urlPattern).test(response.url()) && (!intercept.resourceType || response.request().resourceType() === intercept.resourceType)) {
            try {
              const json = await response.json();
              result.networkJsonPayload = json; // Store the first matching payload
              
              // Extract data based on pricePaths
              if (intercept.pricePaths.productName && json[intercept.pricePaths.productName]) {
                 result.productName = String(json[intercept.pricePaths.productName]);
              }
              if (intercept.pricePaths.sku && json[intercept.pricePaths.sku]) {
                 result.sku = String(json[intercept.pricePaths.sku]);
              }
              
              const rates: RentalRates = result.rates || {};
              let currency: string | undefined;

              if (intercept.pricePaths.currency) {
                if (json[intercept.pricePaths.currency]) {
                  currency = String(json[intercept.pricePaths.currency]);
                } else {
                   // Check if currency is a fixed string like "USD"
                   if (!Object.keys(json).includes(intercept.pricePaths.currency) && /^[A-Z]{3}$/.test(intercept.pricePaths.currency)) {
                    currency = intercept.pricePaths.currency;
                   }
                }
              }
              if(!currency) currency = vendorConfig.rateParsingConfig?.currencySymbol === '$' ? 'USD' : undefined; // Default assumption


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

              break; // Process first matching intercept
            } catch (e) {
              console.warn(`Error processing network intercept for ${response.url()}: ${e instanceof Error ? e.message : String(e)}`);
            }
          }
        }
      });
      // Need to reload or wait for actions that trigger the calls if they haven't fired yet.
      // For simplicity, we assume target calls fire after initial load or during autoScroll.
      // More robust: page.waitForResponse after action, or specific condition.
    }
    
    context.heartbeat('Handling cookie and modal banners');
    await safeClick(page, 'button:has-text("Accept")');
    await safeClick(page, 'button:has-text("Close"), [aria-label="close"], button[aria-label="Close"]');
    await page.waitForLoadState('networkidle');

    context.heartbeat('Performing auto-scroll');
    await autoScroll(page);
    context.heartbeat('Auto-scroll complete');

    const htmlContent = await page.content();
    const $ = cheerio.load(htmlContent);

    context.heartbeat('Extracting data using selectors');

    if (vendorConfig.customParser) {
      context.heartbeat('Running custom parser');
      try {
        // Ensure 'page' and '$' (cheerio) are available if the customParser expects them
        // The customParser function must be self-contained or only use globally available objects.
        // For security, avoid passing node-specific modules like 'fs' directly.
        // If the custom parser needs Playwright page or Cheerio API, they must be passed explicitly.
        const customParserFunc = new Function('initialData', 'page', 'cheerioPage', `return (${vendorConfig.customParser})(initialData, page, cheerioPage)`);
        const customData = await customParserFunc(result, page, $);
        Object.assign(result, customData);
      } catch (e) {
        console.error(`Error in custom parser for ${url}: ${e instanceof Error ? e.message : String(e)}`);
        result.error = `Custom parser error: ${e instanceof Error ? e.message : String(e)}`;
      }
    }

    context.heartbeat('Data extraction complete');

  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    console.error(`Error scraping ${url} for vendor ${vendorId}: ${error.message}`);
    result.error = error.message;
    
    if (playwrightHandles) {
      context.heartbeat('Error occurred, taking debug snapshot');
      const { page } = playwrightHandles;
      try {
        const snapshotDir = path.join(DEBUG_SNAPSHOTS_DIR, vendorId, new URL(url).hostname, new Date().toISOString().replace(/[:.]/g, '-'));
        await fs.ensureDir(snapshotDir);
        
        const htmlPath = path.join(snapshotDir, 'page.html');
        const screenshotPath = path.join(snapshotDir, 'screenshot.png');
        
        const htmlContentOnError = await page.content().catch(() => 'Error fetching HTML content.');
        await fs.writeFile(htmlPath, htmlContentOnError);
        await page.screenshot({ path: screenshotPath, fullPage: true }).catch(err => console.error('Failed to take screenshot:', err));
        
        result.rawHtmlContent = `Error snapshot saved to: ${snapshotDir}`; // Store path or indicator
        context.log.error(`Debug snapshot saved to ${snapshotDir}`);
      } catch (snapshotError) {
        console.error(`Failed to save debug snapshot for ${url}: ${snapshotError instanceof Error ? snapshotError.message : String(snapshotError)}`);
        result.rawHtmlContent = 'Failed to save error snapshot.';
      }
    } else {
       result.rawHtmlContent = 'Playwright handles not available for snapshot.';
    }
  } finally {
    context.heartbeat('Closing Playwright');
    if (playwrightHandles) {
      await playwrightHandles.browser.close().catch(err => console.error('Error closing browser:', err));
    }
  }
  context.heartbeat('Scraper activity finished');
  return result;
} 