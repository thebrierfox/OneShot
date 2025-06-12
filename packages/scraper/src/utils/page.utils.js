"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoScroll = exports.safeClick = void 0;
/**
 * Attempts to click a selector if it appears within the timeout window. Returns true if clicked.
 */
async function safeClick(page, selector, timeout = 5000) {
    try {
        const elt = await page.waitForSelector(selector, { timeout });
        if (elt) {
            await elt.click({ timeout });
            return true;
        }
    }
    catch {
        /* element did not appear – ignore */
    }
    return false;
}
exports.safeClick = safeClick;
/**
 * Incrementally scrolls the page to the bottom so that lazy-loaded content appears.
 */
async function autoScroll(page, step = 250, delayMs = 100) {
    const args = { step, delay: delayMs };
    await page.evaluate(({ step, delay }) => {
        return new Promise((resolve) => {
            let total = 0;
            const timer = setInterval(() => {
                const { scrollHeight } = document.body;
                window.scrollBy(0, step);
                total += step;
                if (total >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, delay);
        });
    }, args);
}
exports.autoScroll = autoScroll;
//# sourceMappingURL=page.utils.js.map