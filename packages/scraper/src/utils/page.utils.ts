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

/**
 * Sunbelt-specific helper – opens the rate modal, enters a ZIP code and waits until the
 * pricing XHR fires. This is needed because PDP shows dashes (–) until a location is set.
 */
export async function setDefaultLocation(page: Page, zip = '32805'): Promise<void> {
  // 0. Dismiss cookie banners if present (common selectors)
  await safeClick(page, 'button:has-text("Accept All"), button:has-text("Accept Cookies"), [data-testid*="accept" i]', 3000);

  // 1. Open the "Add rental details" modal (ignore if already open)
  await safeClick(page, '[data-testid="productTile_add_rental_details"]');

  // 2. Wait for the modal's ZIP input to become visible
  const zipInput = await page.waitForSelector(
    'input[name="zipCode"], input[name="zip"], input[placeholder*="ZIP" i]',
    { timeout: 8000 }
  ).catch(() => null);
  if (!zipInput) return;

  // 3. Type the ZIP (Sunbelt shows an autocomplete list)
  await zipInput.fill(zip);
  await page.waitForTimeout(300); // allow debounce

  //   Click first suggestion if it appears; otherwise press Enter to commit
  const firstSuggestion = await page.$('div[role="option"]');
  if (firstSuggestion) {
    await firstSuggestion.click();
  } else {
    await page.keyboard.press('Enter');
  }

  // 4. Some versions require picking dates – set start = today, end = tomorrow via JS
  try {
    await page.evaluate(() => {
      const startEl = document.querySelector('input[name="startDate"], input[id*="start-date" i]') as HTMLInputElement | null;
      const endEl   = document.querySelector('input[name="endDate"],   input[id*="end-date"   i]') as HTMLInputElement | null;
      if (startEl && endEl) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const tomorrow = new Date(+today + 24 * 3600 * 1000);
        const mm2 = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const dd2 = String(tomorrow.getDate()).padStart(2, '0');
        startEl.value = `${yyyy}-${mm}-${dd}`;
        endEl.value   = `${tomorrow.getFullYear()}-${mm2}-${dd2}`;
        startEl.dispatchEvent(new Event('input', { bubbles: true }));
        endEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  } catch {/* non-fatal */}

  // 5. Click the final Apply / Done / Save button in the modal
  await safeClick(page, 'button:has-text("Apply"), button:has-text("Done"), button:has-text("Save")');

  // 6. Wait for the pricing endpoint to return (max 15 s)
  await page.waitForResponse(
    (resp) => /commerce\/pricing\/v\d/.test(resp.url()) && resp.status() === 200,
    { timeout: 15000 }
  ).catch(() => {/* let caller decide if no pricing */});
} 