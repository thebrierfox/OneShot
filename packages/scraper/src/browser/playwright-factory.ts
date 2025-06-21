import { chromium as vanillaChromium, Page, BrowserContext, Browser, ConnectOptions } from 'playwright';

export interface LaunchPlaywrightOptions {
  /** WebSocket endpoint of the Browserless.io service (e.g., wss://chrome.browserless.io?token=YOUR_TOKEN) */
  browserlessWsEndpoint: string;
  /** Options to pass to browser.newContext(). If `proxyServer` is also set, it will be merged into these options. */
  contextOptions?: Record<string, any>;
  /** Optional proxy server URL (e.g., http://user:pass@host:port) for browser traffic. */
  proxyServer?: string;
  /** Additional options for playwright.chromium.connect() */
  connectOptions?: ConnectOptions;
  /** If true, launch Playwright locally with stealth plugin (ignores browserlessWsEndpoint) */
  useStealth?: boolean;
}

export interface PlaywrightHandles {
  page: Page;
  context: BrowserContext;
  browser: Browser;
}

/**
 * Launches a Playwright browser instance connected to a Browserless service,
 * creates a new context (optionally behind a proxy), and returns browser handles.
 */
export async function launchPlaywright(
  options: LaunchPlaywrightOptions,
): Promise<PlaywrightHandles> {
  const {
    browserlessWsEndpoint,
    contextOptions = {},
    proxyServer,
    connectOptions: userConnectOptions = {},
    useStealth = false,
  } = options;

  const finalConnectOptions: ConnectOptions = {
    ...userConnectOptions,
    timeout: userConnectOptions.timeout || 60_000,
  };

  let browser: Browser;

  if (useStealth && !browserlessWsEndpoint) {
    // Dynamically import playwright-extra and stealth plugin to avoid type clashes
    try {
      const { chromium: chromiumExtra } = (await import('playwright-extra')) as any;
      const stealthPlugin = ((await import('puppeteer-extra-plugin-stealth')) as any).default;
      // register plugin then launch
      (chromiumExtra as any).use(stealthPlugin());
      browser = (await (chromiumExtra as any).launch({ headless: true })) as any;
    } catch (error) {
      console.error('Failed to launch local stealth Playwright', error);
      throw error;
    }
  } else if (browserlessWsEndpoint) {
    const connectEndpoint = browserlessWsEndpoint;
    try {
      browser = await vanillaChromium.connect(connectEndpoint, finalConnectOptions);
    } catch (error) {
      console.error(`Failed to connect to Browserless endpoint: ${connectEndpoint}`, error);
      throw new Error(
        `Playwright connection failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  } else {
    // vanilla local launch
    browser = await vanillaChromium.launch({ headless: true });
  }

  const finalContextOptions = { ...contextOptions };
  if (proxyServer) {
    finalContextOptions.proxy = { server: proxyServer };
  }

  let context: BrowserContext;
  try {
    context = await browser.newContext(finalContextOptions);
  } catch (error) {
    console.error('Failed to create Playwright browser context or set proxy', error);
    await browser.close();
    throw new Error(
      `Playwright context/proxy failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  let page: Page;
  try {
    page = await context.newPage();
  } catch (error) {
    console.error('Failed to create new page in Playwright context', error);
    await context.close();
    await browser.close();
    throw new Error(
      `Playwright page creation failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  return { page, context, browser };
}
