"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchPlaywright = void 0;
const playwright_1 = require("playwright");
/**
 * Launches a Playwright browser instance connected to a Browserless service,
 * creates a new context (optionally behind a proxy), and returns browser handles.
 */
async function launchPlaywright(options) {
    const { browserlessWsEndpoint, contextOptions = {}, proxyServer, connectOptions: userConnectOptions = {}, } = options;
    const finalConnectOptions = {
        ...userConnectOptions,
        timeout: userConnectOptions.timeout || 60_000,
    };
    let browser;
    try {
        browser = await playwright_1.chromium.connect(browserlessWsEndpoint, finalConnectOptions);
    }
    catch (error) {
        console.error(`Failed to connect to Browserless endpoint: ${browserlessWsEndpoint}`, error);
        throw new Error(`Playwright connection failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    const finalContextOptions = { ...contextOptions };
    if (proxyServer) {
        finalContextOptions.proxy = { server: proxyServer };
    }
    let context;
    try {
        context = await browser.newContext(finalContextOptions);
    }
    catch (error) {
        console.error('Failed to create Playwright browser context or set proxy', error);
        await browser.close();
        throw new Error(`Playwright context/proxy failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    let page;
    try {
        page = await context.newPage();
    }
    catch (error) {
        console.error('Failed to create new page in Playwright context', error);
        await context.close();
        await browser.close();
        throw new Error(`Playwright page creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    return { page, context, browser };
}
exports.launchPlaywright = launchPlaywright;
//# sourceMappingURL=playwright-factory.js.map