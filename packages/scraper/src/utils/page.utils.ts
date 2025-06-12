import type { Page } from 'playwright';

/**
 * Attempts to click a selector if it appears within the timeout window. Returns true if clicked.
 */
export async function safeClick(page: Page, selector: string, timeout = 5000): Promise<boolean> {
  try {
    const elt = await page.waitForSelector(selector, { timeout });
    if (elt) {
      await elt.click({ timeout });
      return true;
    }
  } catch {
    /* element did not appear – ignore */
  }
  return false;
}

/**
 * Incrementally scrolls the page to the bottom so that lazy-loaded content appears.
 */
export async function autoScroll(page: Page, step = 250, delayMs = 100): Promise<void> {
  const args = { step, delay: delayMs } as const;
  await page.evaluate(
    ({ step, delay }: { step: number; delay: number }) => {
      return new Promise<void>((resolve) => {
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
    },
    args,
  );
} 