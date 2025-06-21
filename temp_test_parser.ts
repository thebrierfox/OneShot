import { sunbeltConfig } from './packages/scraper/src/configs/sunbelt.config';
(async () => {
  process.env.SCRAPINGBEE_API_KEY = '40IPLITTQW1N2OUIX8LBO941BM8TF5HH774FFVEHZE7X1A9WOSD6GLVH3NFZDSG3V17HJNRJ69F570X1';
  const input: any = { url: 'https://www.sunbeltrentals.com/equipment-rental/earth-moving/2-000-lb-mini-excavator/0350110/' };
  try {
    const res = await (sunbeltConfig as any).customParser(input);
    console.log('Result:', res);
  } catch (err) {
    console.error('Error:', err);
  }
})(); 