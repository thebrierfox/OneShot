const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const TOKEN = process.env.BROWSERLESS_TOKEN || 'localtoken';
  const WS_ENDPOINT = `ws://localhost:3000?token=${TOKEN}`;
  console.log('Connecting to Browserless at', WS_ENDPOINT);

  const browser = await chromium.connectOverCDP(WS_ENDPOINT);
  const context = await browser.newContext();
  const page = await context.newPage();

  // Log console messages from the page
  page.on('console', (msg) => {
    console.log('[PAGE Console]', msg.type(), msg.text());
  });

  // Log failed requests
  page.on('requestfailed', (request) => {
    console.log('[Request Failed]', request.url(), request.failure()?.errorText);
  });

  // Log responses, looking for /commerce/pricing/
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/commerce/pricing/')) {
      const status = response.status();
      console.log(`[Pricing API] ${status} - ${url}`);
      try {
        const body = await response.text();
        console.log(`[Pricing API Body Preview]`, body.slice(0, 400));
      } catch (err) {
        console.error('Error reading response body:', err);
      }
    }
  });

  const SUNBELT_URL = 'https://www.sunbeltrentals.com/equipment-rental/earth-moving/2-000-lb-mini-excavator/0350110/';
  console.log('Navigating to Sunbelt PDP:', SUNBELT_URL);
  await page.goto(SUNBELT_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
  console.log('Page DOM loaded. Waiting for product rental button...');

  try {
    const buttonSelector = '[data-testid="productTile_add_rental_details"], button:has-text("Enter rental details"), button:has-text("add rental details")';
    await page.waitForSelector(buttonSelector, { timeout: 30000 });
    await page.click(buttonSelector);
    console.log('Clicked rental details button.');

    // Wait for modal input
    const zipInputSelector = 'input[type="text"][maxlength="5"], input[name="zip-code"], input[data-testid*="zip"], input[id*="zip"], input[aria-label*="Zip" i]';
    const modalSelector = '[role="dialog"], .ReactModal__Content';
    await page.waitForSelector(modalSelector, { timeout: 30000 });

    if (await page.$(zipInputSelector)) {
      await page.fill(zipInputSelector, '63701'); // Cape Girardeau, MO
      console.log('Filled ZIP code 63701.');
    } else {
      console.warn('ZIP input not found; capturing modal HTML for debugging.');
      const modalHtml = await page.$eval(modalSelector, el => el.innerHTML);
      require('fs').writeFileSync('modal_dump.html', modalHtml, 'utf-8');
    }

    // Click rental location button to open location selector if present
    const locationBtn = '[data-testid="cap_location_input_btn_testid"], button:has-text("Enter an address")';
    if (await page.$(locationBtn)) {
      await page.click(locationBtn);
      console.log('Clicked location input button.');

      // Wait for actual text input in location selector modal/drawer
      const locationInput = 'input[type="text"][aria-label*="location" i], input[placeholder*="address" i]';
      try {
        await page.waitForSelector(locationInput, { timeout: 15000 });
        await page.fill(locationInput, 'Cape Girardeau, MO');
        await page.keyboard.press('Enter');
        console.log('Entered location Cape Girardeau, MO');
      } catch {
        console.warn('Location input not found');
      }
    }

    // Click Apply / Done
    const applySelectors = [
      '[data-testid="location_selector_apply_button"]',
      'button:has-text("Apply")',
      'button:has-text("Done")'
    ];
    let clicked = false;
    for (const sel of applySelectors) {
      if (await page.$(sel)) {
        await page.click(sel);
        console.log('Clicked apply/done button:', sel);
        clicked = true;
        break;
      }
    }
    if (!clicked) console.warn('Could not find Apply/Done button.');
  } catch (err) {
    console.error('Error during modal interaction:', err);
  }

  console.log('Waiting 15 seconds for network activity...');
  await page.waitForTimeout(15000);
  await browser.close();
  console.log('Done.');
})(); 