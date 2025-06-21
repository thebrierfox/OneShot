const { sunbeltConfig } = require('../packages/scraper/src/configs/sunbelt.config.ts');

(async () => {
  const url = 'https://www.sunbeltrentals.com/equipment-rental/earth-moving/2-000-lb-mini-excavator/0350110/';
  try {
    const res = await sunbeltConfig.customParser({ url });
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('Parser failed', err);
    process.exit(1);
  }
})(); 