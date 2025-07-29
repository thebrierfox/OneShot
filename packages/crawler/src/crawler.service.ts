import * as dotenv from 'dotenv';
import type { PlaywrightLaunchContext, PlaywrightGotoOptions } from 'crawlee';
import { PlaywrightCrawler, type PlaywrightCrawlingContext } from 'crawlee';
import { Client } from '@temporalio/client';
import type { ScraperVendorConfig as VendorConfig } from '@patriot-rentals/shared-types';
import { getProxyConfiguration } from './utils/proxy.util';
import { solveWithFlareSolverr, FlareSolverrResponse } from './utils/flaresolverr.client';
import { URL } from 'node:url';
import { Page } from 'playwright';

dotenv.config();

const DEFAULT_MAX_REQUEST_RETRIES = 3;
const DEFAULT_NAVIGATION_TIMEOUT_SECS = 120;
const DEFAULT_REQUEST_HANDLER_TIMEOUT_SECS = 120;

const DEFAULT_CRAWLER_OPTIONS = {
  maxRequestsPerCrawl: 1000,
  navigationTimeoutSecs: 120,
  maxRequestRetries: 5,
};

/**
 * Runs crawlers for the specified vendor configurations.
 * @param vendorConfigsToProcess Array of vendor configurations to process.
 * @param temporalClient Temporal client instance.
 * @param options Options for the crawl run, e.g., forceRecrawlAll.
 */
export async function runCrawlers(
  vendorConfigsToProcess: VendorConfig[],
  temporalClient: Client,
  options: { forceRecrawlAll?: boolean } = {},
): Promise<void> {
  console.log(`Starting crawler service for ${vendorConfigsToProcess.length} vendor(s).`);

  const httpProxyString = process.env.HTTP_PROXY_STRING;
  const baseProxyConfig = await getProxyConfiguration(httpProxyString);

  for (const vendorConfig of vendorConfigsToProcess) {
    console.log(`Starting crawl for ${vendorConfig.displayName} (ID: ${vendorConfig.id})`);

    try {
      const launchContext: PlaywrightLaunchContext = {
        launchOptions: vendorConfig.playwrightContextOptions?.launchOptions || {},
        proxyUrl: baseProxyConfig?.proxyUrls?.[0],
        userAgent: vendorConfig.playwrightContextOptions?.userAgent,
        useChrome: vendorConfig.playwrightContextOptions?.useChrome,
        extraHTTPHeaders: vendorConfig.playwrightContextOptions?.extraHTTPHeaders,
        locale: vendorConfig.playwrightContextOptions?.locale,
        timezoneId: vendorConfig.playwrightContextOptions?.timezoneId,
        viewport: vendorConfig.playwrightContextOptions?.viewport,
      };

      const crawler = new PlaywrightCrawler({
        proxyConfiguration: baseProxyConfig, // May be overridden by FlareSolverr logic per request basis if needed
        launchContext,
        requestHandlerTimeoutSecs: vendorConfig.crawlerOptions?.requestHandlerTimeoutSecs || DEFAULT_REQUEST_HANDLER_TIMEOUT_SECS,
        navigationTimeoutSecs: vendorConfig.crawlerOptions?.navigationTimeoutSecs || DEFAULT_NAVIGATION_TIMEOUT_SECS,
        maxRequestRetries: vendorConfig.crawlerOptions?.maxRequestRetries || DEFAULT_MAX_REQUEST_RETRIES,
        maxRequestsPerCrawl: DEFAULT_CRAWLER_OPTIONS.maxRequestsPerCrawl,
        
        preNavigationHooks: [
          async (crawlingContext: PlaywrightCrawlingContext, gotoOptions?: PlaywrightGotoOptions) => {
            const { request, page, log } = crawlingContext;
            if (vendorConfig.useFlaresolverr) {
              log.info(`Using FlareSolverr for URL: ${request.url}`);
              try {
                const flareResponse: FlareSolverrResponse = await solveWithFlareSolverr(request.url);
                if (flareResponse.solution && flareResponse.solution.response) {
                  log.info(`FlareSolverr solved successfully for ${request.url}. Status: ${flareResponse.solution.status}`);
                  // Apply cookies from FlareSolverr to Playwright context
                  const context = page.context();
                  await context.addCookies(flareResponse.solution.cookies.map(c => ({
                    name: c.name,
                    value: c.value,
                    domain: c.domain || new URL(request.url).hostname,
                    path: c.path || '/',
                    expires: c.expires,
                    httpOnly: c.httpOnly,
                    secure: c.secure,
                    sameSite: c.sameSite || 'Lax' // Default to Lax if not specified
                  })));
                  
                  await page.setContent(flareResponse.solution.response, { waitUntil: 'domcontentloaded' });
                  request.userData = {
                    ...request.userData,
                    isFlareSolverrContent: true,
                    originalUrl: request.url, // Store original URL for enqueuing links
                    flareSolverrUserAgent: flareResponse.solution.userAgent,
                  };
                  // If FlareSolverr provides a specific user-agent, try to set it for this page context
                  // Note: This might be tricky as user-agent is usually a context-level setting.
                  // For simplicity, we log it. For stricter emulation, browser context might need re-creation or specific handling.
                  if (launchContext.userAgent !== flareResponse.solution.userAgent) {
                    log.info(`FlareSolverr User-Agent: ${flareResponse.solution.userAgent}. Crawler User-Agent: ${launchContext.userAgent}`);
                  }

                } else {
                  log.error(`FlareSolverr did not return a valid solution for ${request.url}. Message: ${flareResponse.message}`);
                  throw new Error(`FlareSolverr failed: ${flareResponse.message}`);
                }
              } catch (error) {
                log.error(`Error using FlareSolverr for ${request.url}: ${error instanceof Error ? error.message : String(error)}`);
                throw error; // Propagate error to stop this request processing by Crawlee
              }
            }
          },
        ],
        requestHandler: async (context: PlaywrightCrawlingContext) => {
          const { request, page, enqueueLinks, log } = context;
          const currentUrl = request.userData?.isFlareSolverrContent ? request.userData.originalUrl : page.url();
          log.info(`Processing: ${currentUrl}`);

          try {
            let isProductPage = new RegExp(vendorConfig.productUrlDetectRegex, 'i').test(currentUrl);
            
            if (isProductPage && vendorConfig.isProductPageChecker) {
              try {
                const pageContent = await page.content();
                // Ensure the checker function has access to necessary scope if it relies on external vars
                const checkerFunc = new Function('url', 'pageContent', `return (${vendorConfig.isProductPageChecker})(url, pageContent)`);
                isProductPage = await checkerFunc(currentUrl, pageContent);
                log.debug(`Custom product page checker result for ${currentUrl}: ${isProductPage}`);
              } catch (e) {
                log.error(`Error executing custom product page checker for ${currentUrl}: ${e instanceof Error ? e.message : String(e)}`);
                isProductPage = false; // Assume not a product page on checker error
              }
            }

            if (isProductPage) {
              log.info(`Product page found: ${currentUrl} (Vendor: ${vendorConfig.id})`);
              const temporalTaskQueue = process.env.TEMPORAL_TASK_QUEUE_SCRAPER;
              if (!temporalTaskQueue) {
                log.error('TEMPORAL_TASK_QUEUE_SCRAPER environment variable is not set. Cannot dispatch scrape task.');
                throw new Error('TEMPORAL_TASK_QUEUE_SCRAPER not configured.');
              }
              const workflowId = `scrape-${vendorConfig.id}-${encodeURIComponent(currentUrl).substring(0, 75)}-${Date.now()}`;
              await temporalClient.workflow.start('scrapeProductWorkflow', {
                args: [{ url: currentUrl, vendorId: vendorConfig.id, forceRescrape: options.forceRecrawlAll }],
                taskQueue: temporalTaskQueue,
                workflowId,
              });
              log.info(`Dispatched scrape task to Temporal for ${currentUrl}. Workflow ID: ${workflowId}`);
            } else {
              log.debug(`Not a product page, attempting to enqueue links from: ${currentUrl}`);
              const enqueueOptions = {
                page,
                request,
                selector: 'a[href]', // Basic link enqueueing
                strategy: 'same-domain' as const,
                baseUrl: request.userData?.isFlareSolverrContent ? request.userData.originalUrl : undefined,
              };
              await enqueueLinks(enqueueOptions);
            }
          } catch (error) {
            log.error(`Error in requestHandler for ${currentUrl} (Vendor: ${vendorConfig.id}): ${error instanceof Error ? error.message : String(error)}`);
            // Optionally, rethrow if you want Crawlee to retry based on its retry policies
            // throw error;
          }
        },
        failedRequestHandler: async ({ request, log, error }: PlaywrightCrawlingContext & { error: Error }) => {
          log.error(`Request ${request.url} failed.`, { error: error.message });
          await handleFailedRequest(request.url, error.message, vendorConfig.id);
        },
      });

      const startUrls = vendorConfig.startUrls.map((url: string) => ({ url, userData: { vendorId: vendorConfig.id } }));
      console.info(`Adding ${startUrls.length} start URLs for ${vendorConfig.displayName}.`);
      await crawler.addRequests(startUrls);

      console.info(`Running crawler for ${vendorConfig.displayName}...`);
      await crawler.run();
      console.info(`Crawler for ${vendorConfig.displayName} finished.`);

    } catch (error) {
      console.error(`Failed to run crawler for vendor ${vendorConfig.displayName} (ID: ${vendorConfig.id}): ${error instanceof Error ? error.message : String(error)}`);
      // Continue with the next vendor
    }
  }
  console.log('All vendor crawls initiated or completed.');
}

async function handleFailedRequest(url: string, errorMessage: string, vendorId: string): Promise<void> {
  // Implem  /*
   * When a request exhausts all retries, surface the appropriate
   * Stagehand trigger code to the orchestrator. The Quick-Patch
   * checklist (Master Directive §17) requires that vendor scrapers
   * throw a typed error with a `needsAgent` property so the caller
   * can spawn a live browser session via Stagehand. Map known
   * vendor IDs to their canonical trigger codes, and fall back to
   * a generic PDF download trigger for any other vendor.
   */
  const triggerMap: Record<string, string> = {
    sunbelt: 'SUNBELT_MODAL',
    unitedrentals: 'UNITED_PDF',
  };
  const needsAgent = triggerMap[vendorId] || 'PDF_DOWNLOAD';
  const err: any = new Error(`Request failed for ${url}: ${errorMessage}`);
  err.needsAgent = needsAgent;
  throw err;
}
