import { CheerioCrawler, Dataset } from 'crawlee';
import fs from 'fs-extra';
import path from 'path';

/**
 * Skeleton crawler that paginates Patriot's EZRent storefront and extracts
 * product rows. Writes minimal `config/patriot_catalog.csv`.
 */
export async function crawlPatriotCatalog(): Promise<void> {
  const dataset = await Dataset.open('patriot-products');
  await dataset.drop();

  const crawler = new CheerioCrawler({
    async requestHandler({ request, $, enqueueLinks, log }) {
      if (!$) return;
      $('.card-product').each((_, el) => {
        const name = $(el).find('.card-title').text().trim();
        const priceDay = $(el).find('li:contains("/day")').text().replace(/[^0-9.]/g, '');
        const group = $(el).find('.card-product-group').text().trim();
        dataset.pushData({ name, group, price_day: priceDay });
      });
      // enqueue next page if exists
      const nextHref = $('a[rel="next"]').attr('href');
      if (nextHref) enqueueLinks({ urls: [new URL(nextHref, request.loadedUrl!).href] });
    },
  });

  await crawler.run([
    'https://patriotequipmentrentals.ezrentalstore.com/?page=1',
  ]);

  const items = await dataset.getData();
  const outPath = path.resolve(process.cwd(), 'config', 'patriot_catalog.csv');
  await fs.ensureDir(path.dirname(outPath));
  const header = 'patriot_sku,name,category,price_day\n';
  const rows = items.items.map((it: any, idx: number) => `P-${idx + 1},"${it.name}","${it.group}",${it.price_day}`);
  await fs.writeFile(outPath, header + rows.join('\n'));
  console.log(`[crawler] patriot_catalog.csv written with ${rows.length} rows`);
} 