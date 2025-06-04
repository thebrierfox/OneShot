import { chromium, Page, BrowserContext, Browser, ConnectOptions } from 'playwright';
import { applyStealth, StealthOptions } from '@playwright/stealth';

export interface LaunchPlaywrightOptions {
  /** WebSocket endpoint of the Browserless.io service (e.g., wss://chrome.browserless.io?token=YOUR_TOKEN) */
  browserlessWsEndpoint: string;
  /** Options to pass to browser.newContext(). If `proxyServer` is also set, it will be merged into these options. */
  contextOptions?: Record<string, any>;
  /** Optional proxy server URL (e.g., http://user:pass@host:port) for browser traffic. */
  proxyServer?: string;
  /** Additional options for playwright.chromium.connect() */
  connectOptions?: ConnectOptions;
  /** Options for the stealth plugin */
  stealthPluginOptions?: StealthOptions;
}

export interface PlaywrightHandles {
  page: Page;
  context: BrowserContext;
  browser: Browser;
}

/**
 * Launches a Playwright browser instance connected to a Browserless service,
 * creates a new context with stealth and optional proxy, and returns browser handles.
 * @param options Configuration options for launching Playwright.
 * @returns A promise resolving to an object containing the page, context, and browser.
 * @throws Will throw an error if connection to Browserless fails or context/page creation fails.
 */
export async function launchPlaywright(
  options: LaunchPlaywrightOptions,
): Promise<PlaywrightHandles> {
  const {
    browserlessWsEndpoint,
    contextOptions = {},
    proxyServer,
    connectOptions: userConnectOptions = {},
    stealthPluginOptions = {},
  } = options;

  const finalConnectOptions: ConnectOptions = {
    ...userConnectOptions,
    timeout: userConnectOptions.timeout || 60000, // Default timeout for connect
  };
  // Note: If the browserlessWsEndpoint itself needs a proxy to be reached (rare),
  // it would be set in finalConnectOptions.proxy, but that's not what proxyServer option is for.

  let browser: Browser;
  try {
    browser = await chromium.connect(browserlessWsEndpoint, finalConnectOptions);
  } catch (error) {
    console.error(`Failed to connect to Browserless endpoint: ${browserlessWsEndpoint}`, error);
    throw new Error(`Playwright connection failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  const finalContextOptions = { ...contextOptions };
  if (proxyServer) {
    finalContextOptions.proxy = { server: proxyServer };
  }

  let context: BrowserContext;
  try {
    context = await browser.newContext(finalContextOptions);
    await applyStealth(context, stealthPluginOptions);
  } catch (error) {
    console.error('Failed to create Playwright browser context, apply stealth, or set proxy', error);
    if (browser) await browser.close(); 
    throw new Error(`Playwright context/stealth/proxy failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  let page: Page;
  try {
    page = await context.newPage();
  } catch (error) {
    console.error('Failed to create new page in Playwright context', error);
    if (context) await context.close();
    if (browser) await browser.close();
    throw new Error(`Playwright page creation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return { page, context, browser };
} 