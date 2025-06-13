import { crawlVendor } from './scripts/crawl-vendor';
import { crawlPatriotCatalog } from './configs/patriot.config';

.command('vendor <id>', 'Crawl a competitor vendor by ID')
.command('patriot', 'Crawl Patriot catalogue', async () => {
  await crawlPatriotCatalog();
}) 