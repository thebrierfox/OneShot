import { Page, BrowserContext, Browser, ConnectOptions } from 'playwright';
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
export declare function launchPlaywright(options: LaunchPlaywrightOptions): Promise<PlaywrightHandles>;
