import * as dotenv from 'dotenv';
import * as cheerio from 'cheerio';
import fs from 'fs-extra';
import path from 'path';
import { launchPlaywright, PlaywrightHandles } from '../browser/playwright-factory';
import { vendorConfigMap } from '../configs';
import type { RawScrapedProduct, VendorConfig, Price, RentalRates } from '@patriot-rentals/shared-types';
import { Context } from '@temporalio/activity';
import { safeClick, autoScroll, setDefaultLocation } from '../utils/page.utils';

// Always load the repo-root .env so that isolated activity context has the vars
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const DEBUG_SNAPSHOTS_DIR = process.env.DEBUG_SNAPSHOTS_DIR || './debug_snapshots';

// Resolve the Browserless WebSocket endpoint in a predictable order of precedence:
//   1. If BROWSERLESS_WS_ENDPOINT is provided, always use it verbatim.
//   2. Otherwise, build one from BROWSERLESS_HOST / BROWSERLESS_PORT / BROWSERLESS_TOKEN.
//      (This prevents accidentally favouring a partly-formed host string when an explicit
//       full endpoint has already been configured.)
const BROWSERLESS_WS_ENDPOINT = process.env.BROWSERLESS_WS_ENDPOINT
  ? process.env.BROWSERLESS_WS_ENDPOINT
  : process.env.BROWSERLESS_HOST
      ? `ws://${process.env.BROWSERLESS_HOST}:${process.env.BROWSERLESS_PORT || 3000}/chromium/playwright?token=${process.env.BROWSERLESS_TOKEN || 'localtoken'}`
      : undefined;

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

/**
 * Lightweight utility to safely resolve nested properties using dot-notation paths.
 * E.g. getNested(obj, 'prices.ONE_DAY') → obj.prices?.ONE_DAY
 */
function getNested(obj: any, path: string | undefined): any {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc: any, key: string) => (acc != null ? acc[key] : undefined), obj);
}

export async function scrapeProductPageActivity(url: string, vendorId: string): Promise<RawScrapedProduct> {
  const context = Context.current();
  context.heartbeat('Scraper activity started');

  const vendorConfig = vendorConfigMap[vendorId];
  if (!vendorConfig) {
    throw new Error(`No vendor configuration found for vendorId: ${vendorId}`);
  }

  if (!BROWSERLESS_WS_ENDPOINT && !(vendorId === 'sunbelt' && vendorConfig.customParser)) {
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

  // ──────────────────────────────────────────────────────────────
  // EARLY SHORT-CIRCUIT FOR SUNBELT
  // If a customParser exists (which now fetches prices through the
  // ScrapingBee HTML-API) try it *before* launching Playwright.
  // Successful extraction means we can completely skip the heavy
  // browser workflow, eliminating the chance of long-running
  // Playwright shutdowns that previously triggered activity
  // timeouts.
  // ──────────────────────────────────────────────────────────────
  if (vendorId === 'sunbelt' && typeof vendorConfig.customParser === 'function') {
    try {
      const parsed = await (vendorConfig.customParser as any)(result);
      if (parsed && parsed.rates && Object.keys(parsed.rates).length > 0) {
        // Merge and return immediately – no browser needed.
        return { ...result, ...parsed } as RawScrapedProduct;
      }
    } catch (earlyErr) {
      // fall through to full Playwright pass
      console.warn('Early customParser for Sunbelt failed, falling back to Playwright:', earlyErr);
    }
  }

  let playwrightHandles: PlaywrightHandles | undefined;

  try {
    context.heartbeat('Launching Playwright');
    playwrightHandles = await launchPlaywright({
      browserlessWsEndpoint: BROWSERLESS_WS_ENDPOINT as string,
      contextOptions: vendorConfig.playwrightContextOptions,
      proxyServer: process.env.HTTP_PROXY_STRING || undefined,
      useStealth: vendorId === 'sunbelt' && !BROWSERLESS_WS_ENDPOINT,
    });
    const { page, browser } = playwrightHandles;
    const navTimeoutMs = vendorConfig.crawlerOptions?.navigationTimeoutSecs ? vendorConfig.crawlerOptions.navigationTimeoutSecs * 1000 : 60000;
    result.httpStatus = (await page.goto(url, { waitUntil: 'domcontentloaded', timeout: navTimeoutMs }) )?.status() || null;
    
    context.heartbeat('Page loaded, starting extraction logic');

    // We will trigger default ZIP modal *after* setting up network intercepts so we capture the pricing JSON.

    if (vendorConfig.networkIntercepts && vendorConfig.networkIntercepts.length > 0) {
      context.heartbeat('Setting up network intercepts');
      page.on('response', async (response) => {
        for (const intercept of vendorConfig.networkIntercepts!) {
          if (new RegExp(intercept.urlPattern).test(response.url()) && (!intercept.resourceType || response.request().resourceType() === intercept.resourceType)) {
            try {
              const json = await response.json();
              result.networkJsonPayload = json; // Store the first matching payload
              
              // Extract data based on pricePaths
              if (intercept.pricePaths.productName) {
                 const val = getNested(json, intercept.pricePaths.productName);
                 if (val != null) result.productName = String(val);
              }
              if (intercept.pricePaths.sku) {
                 const val = getNested(json, intercept.pricePaths.sku);
                 if (val != null) result.sku = String(val);
              }
              
              const rates: RentalRates = result.rates || {};
              let currency: string | undefined;

              if (intercept.pricePaths.currency) {
                const curVal = getNested(json, intercept.pricePaths.currency);
                if (curVal != null) {
                  currency = String(curVal);
                } else {
                   // Check if currency is a fixed string like "USD"
                   if (!Object.keys(json).includes(intercept.pricePaths.currency) && /^[A-Z]{3}$/.test(intercept.pricePaths.currency)) {
                    currency = intercept.pricePaths.currency;
                   }
                }
              }
              if(!currency) currency = vendorConfig.rateParsingConfig?.currencySymbol === '$' ? 'USD' : undefined; // Default assumption


              if (intercept.pricePaths.day) {
                const dayPriceText = getNested(json, intercept.pricePaths.day);
                const amount = typeof dayPriceText === 'number' ? dayPriceText : extractPriceValue(String(dayPriceText), vendorConfig);
                if (amount !== null && currency) rates.perDay = { amount, currency };
              }
              if (intercept.pricePaths.week) {
                const weekPriceText = getNested(json, intercept.pricePaths.week);
                const amount = typeof weekPriceText === 'number' ? weekPriceText : extractPriceValue(String(weekPriceText), vendorConfig);
                if (amount !== null && currency) rates.perWeek = { amount, currency };
              }
              if (intercept.pricePaths.month) {
                const monthPriceText = getNested(json, intercept.pricePaths.month);
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
    
    // Now that intercepts are listening, trigger the pricing modal for Sunbelt pages so the JSON fires
    if (vendorId === 'sunbelt') {
      context.heartbeat('Triggering Sunbelt pricing modal');
      await setDefaultLocation(page);
    }

    context.heartbeat('Handling cookie and modal banners');
    await safeClick(page, 'button:has-text("Accept")');
    await safeClick(page, 'button:has-text("Close"), [aria-label="close"], button[aria-label="Close"]');
    await page.waitForLoadState('domcontentloaded', { timeout: navTimeoutMs });

    context.heartbeat('Performing auto-scroll');
    await autoScroll(page);
    context.heartbeat('Auto-scroll complete');

    // ──────────────────────────────────────────────────────────
    // SUNBELT DOM EXTRACTION — the page now displays prices in
    // data-testid spans after the default ZIP is accepted.  Grab
    // them directly from the live DOM so we never depend on the
    // flaky /commerce/pricing API.
    // ──────────────────────────────────────────────────────────
    if (vendorId === 'sunbelt') {
      try {
        context.heartbeat('Extracting Sunbelt DOM prices');

        await page.waitForSelector('[data-testid="pdp_productOneDay_price"]', { timeout: navTimeoutMs });

        const [dayTxt, weekTxt, monthTxt, nameTxt, skuTxt] = await Promise.all([
          page.$eval('[data-testid="pdp_productOneDay_price"]', el => (el.textContent || '').trim()),
          page.$eval('[data-testid="pdp_productOneWeek_price"]', el => (el.textContent || '').trim()).catch(() => ''),
          page.$eval('[data-testid="pdp_productFourWeek_price"]', el => (el.textContent || '').trim()).catch(() => ''),
          page.$eval('h1.pdp__title', el => (el.textContent || '').trim()).catch(() => ''),
          page.$eval('span[data-testid="pdp_sku"]', el => (el.textContent || '').trim()).catch(() => ''),
        ]);

        const rates: RentalRates = result.rates || {};
        const currency = 'USD';

        const dayAmt = extractPriceValue(dayTxt, vendorConfig);
        if (dayAmt !== null) rates.perDay = { amount: dayAmt, currency };

        const weekAmt = extractPriceValue(weekTxt, vendorConfig);
        if (weekAmt !== null) rates.perWeek = { amount: weekAmt, currency };

        const monthAmt = extractPriceValue(monthTxt, vendorConfig);
        if (monthAmt !== null) rates.perMonth = { amount: monthAmt, currency };

        if (Object.keys(rates).length) result.rates = rates;

        if (!result.productName && nameTxt) result.productName = nameTxt;
        if (!result.sku && skuTxt) result.sku = skuTxt.replace(/[^\dA-Za-z-]/g, '');
      } catch (sunbeltErr) {
        console.warn('Sunbelt DOM extraction failed:', sunbeltErr);
      }
    }

    const htmlContent = await page.content();
    const $ = cheerio.load(htmlContent);

    // ------------------------------------------------------------
    // Generic selector-based extraction (runs before customParser)
    // ------------------------------------------------------------
    if ((vendorConfig as any).selectors) {
      const sel = (vendorConfig as any).selectors as Record<string, string>;

      const textOrNull = (selector?: string) => {
        if (!selector) return null;
        const node = $(selector).first();
        return node.length ? node.text().trim() || null : null;
      };

      result.productName = result.productName || textOrNull(sel.productName);

      // Price parsing util shared earlier
      const dayTxt   = textOrNull(sel.priceDay);
      const weekTxt  = textOrNull(sel.priceWeek);
      const monthTxt = textOrNull(sel.priceMonth);

      const rates: RentalRates = result.rates || {};
      const defaultCurrency = vendorConfig.rateParsingConfig?.currencySymbol === '$' ? 'USD' : 'USD';

      const dayAmt = extractPriceValue(dayTxt, vendorConfig);
      if (dayAmt !== null) rates.perDay = { amount: dayAmt, currency: defaultCurrency };

      const weekAmt = extractPriceValue(weekTxt, vendorConfig);
      if (weekAmt !== null) rates.perWeek = { amount: weekAmt, currency: defaultCurrency };

      const monthAmt = extractPriceValue(monthTxt, vendorConfig);
      if (monthAmt !== null) rates.perMonth = { amount: monthAmt, currency: defaultCurrency };

      if (Object.keys(rates).length) result.rates = rates;

      const skuTxt = textOrNull(sel.sku);
      if (skuTxt) result.sku = skuTxt.replace(/[^\dA-Za-z-]/g, '');

      const descTxt = textOrNull(sel.description);
      if (descTxt) result.description = descTxt;

      if (sel.imageUrl) {
        const img = $(sel.imageUrl).first();
        if (img.length) {
          const src = img.attr('src') || img.attr('data-src');
          if (src) result.imageUrl = src;
        }
      }

      const categoryTxt = textOrNull(sel.category);
      if (categoryTxt) result.category = categoryTxt;
    }

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

  // ──────────────────────────────────────────────────────────────
  // FINAL FALLBACK — if Playwright extraction produced no useful
  // data (productName still null OR every rate missing) and this
  // vendor offers a `customParser`, give it one last chance _after_
  // the fact_. This way we still benefit from the network-intercept
  // path when it works, but we don't exit empty-handed when Cheerio
  // chokes on pseudo-elements or the site blocks headless browsers.
  // ──────────────────────────────────────────────────────────────
  if (
    vendorConfig.customParser &&
    (result.productName == null || Object.keys(result.rates || {}).length === 0)
  ) {
    try {
      const parsed = await (vendorConfig.customParser as any)(result);
      Object.assign(result, parsed);
    } catch (e) {
      result.error = `${result.error || ''} | customParser fallback threw: ${(e as Error).message}`.trim();
    }
  }

  context.heartbeat('Scraper activity finished');
  return result;
} 