// @ts-nocheck
import { CheerioCrawler } from 'crawlee';
import fs from 'fs-extra';
import path from 'path';

/**
 * Skeleton crawler that paginates Patriot's EZRent storefront and extracts
 * product rows. Writes minimal `config/patriot_catalog.csv`.
 */
export async function crawlPatriotCatalog(): Promise<void> {
  const records: any[] = [];

  const crawler = new CheerioCrawler({
    async requestHandler({ request, $, enqueueLinks, log }) {
      if (!$) return;
      $('.item-container').each((_, el) => {
        const $el = $(el);
        const name = $el.find('.item-name a').attr('title')?.trim() || $el.find('.item-name a').text().trim();
        const groupTitle = $el
          .find('p:contains("Group")')
          .attr('title')
          ?.replace(/^Group:\s*/i, '')
          .trim();
        const group = groupTitle || $el.find('p:contains("Group") .grid-view-item-attribute-value').text().trim();
        const priceDay = $el.find('li:contains("/day")').text().replace(/[^0-9.]/g, '');
        const priceWeek = $el.find('li:contains("/week")').text().replace(/[^0-9.]/g, '');
        const priceMonth = $el.find('li:contains("/month")').text().replace(/[^0-9.]/g, '');
        if (!name) return;
        records.push({
          name,
          group,
          price_day: priceDay,
          price_week: priceWeek,
          price_month: priceMonth,
        });
      });
      // enqueue next page if exists
      const nextHref = $('li[data-page].active').next().find('a').attr('href');
      if (nextHref) {
        enqueueLinks({ urls: [new URL(nextHref, request.loadedUrl!).href] });
      }
    },
  });

  await crawler.run([
    'https://patriotequipmentrentals.ezrentalstore.com/?page=1',
  ]);

  const outPath = path.resolve(process.cwd(), 'config', 'patriot_catalog.csv');
  await fs.ensureDir(path.dirname(outPath));
  const header = 'patriot_sku,name,group,price_day,price_week,price_month\n';
  const rows = records.map((it: any, idx: number) => {
    const safeName = it.name.replace(/"/g, '""');
    const safeGroup = it.group.replace(/"/g, '""');
    return `P-${idx + 1},"${safeName}","${safeGroup}",${it.price_day},${it.price_week},${it.price_month}`;
  });
  await fs.writeFile(outPath, header + rows.join('\n'));
  console.log(`[crawler] patriot_catalog.csv written with ${rows.length} rows`);
} 