#!/usr/bin/env ts-node

import { crawlPatriotCatalog } from './configs/patriot.config';

async function main() {
  const [command, ...rest] = process.argv.slice(2);

  switch (command) {
    case 'patriot':
      await crawlPatriotCatalog();
      break;
    default:
      console.error('Unknown command or missing arguments. Usage: "crawl patriot"');
      process.exit(1);
  }
}

main().catch((err) => {
  console.error('[cli] Unhandled error:', err);
  process.exit(1);
}); 