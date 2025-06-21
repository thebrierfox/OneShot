const { chromium } = require('playwright');

(async () => {
  const TOKEN = process.env.BROWSERLESS_TOKEN || 'localtoken';
  const WS = `ws://localhost:3000?token=${TOKEN}`;
  const PAGE_URL = 'https://www.sunbeltrentals.com/equipment-rental/earth-moving/2-000-lb-mini-excavator/0350110/';

  const browser = await chromium.connectOverCDP(WS);
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded' });

  // Wait a bit for CF challenge, etc.
  await page.waitForTimeout(8000);

  const today = new Date();
  const fmt = d => d.toISOString().split('T')[0];
  const start = fmt(today);
  const end = fmt(new Date(today.getTime() + 24*3600*1000));
  const apiUrl = `https://api.sunbeltrentals.com/commerce/pricing/v3?catClass=0350110&storeNumber=00075&startDate=${start}&endDate=${end}&quantity=1&delivery=false&pickup=false`;

  try {
    const result = await page.evaluate(async (url) => {
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json, text/plain, */*'
        },
        credentials: 'include'
      });
      const text = await res.text();
      return { status: res.status, body: text.slice(0, 500) };
    }, apiUrl);

    console.log('API via browser status:', result.status);
    console.log('Body preview:', result.body);
  } catch (err) {
    console.error('Eval error', err);
  } finally {
    await browser.close();
  }
})(); 