import { chromium, Page, BrowserContext, Browser, ConnectOptions } from 'playwright';

export interface LaunchPlaywrightOptions {
  /** WebSocket endpoint of the Browserless.io service (e.g., wss://chrome.browserless.io?token=YOUR_TOKEN) */
  browserlessWsEndpoint: string;
  /** Options to pass to browser.newContext(). If `proxyServer` is also set, it will be merged into these options. */
  contextOptions?: Record<string, any>;
  /** Optional proxy server URL (e.g., http://user:pass@host:port) for browser traffic. */
  proxyServer?: string;
  /** Additional options for playwright.chromium.connect() */
  connectOptions?: ConnectOptions;
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
  } = options;

  const finalConnectOptions: ConnectOptions = {
    ...userConnectOptions,
    timeout: userConnectOptions.timeout || 60_000,
  };

  let browser: Browser;
  try {
    browser = await chromium.connect(browserlessWsEndpoint, finalConnectOptions);
  } catch (error) {
    console.error(`Failed to connect to Browserless endpoint: ${browserlessWsEndpoint}`, error);
    throw new Error(
      `Playwright connection failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
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
