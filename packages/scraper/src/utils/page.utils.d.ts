import type { Page } from 'playwright-core';
/**
 * Attempts to click a selector if it appears within the timeout window. Returns true if clicked.
 */
export declare function safeClick(page: Page, selector: string, timeout?: number): Promise<boolean>;
/**
 * Incrementally scrolls the page to the bottom so that lazy-loaded content appears.
 */
export declare function autoScroll(page: Page, step?: number, delayMs?: number): Promise<void>;
