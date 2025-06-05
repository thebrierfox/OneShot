import * as dotenv from 'dotenv';
import { Client } from '@temporalio/client';
import { runCrawlers } from './crawler.service';
// import { loadVendorConfigs } from '../scraper/src/configs'; // Example if loading configs directly

dotenv.config();

async function main() {
  console.log(
    'Crawler package entry point (packages/crawler/src/index.ts).',
  );
  console.log(
    'In this project, the `runCrawlers` service is typically invoked by the report orchestrator.',
  );
  console.log(
    'This file can be expanded for standalone crawler execution if needed.',
  );

  /*
  // Example of standalone execution (requires proper setup and config loading):
  if (process.env.NODE_ENV === 'development') { // Example guard
    try {
      const temporalClient = new Client({
        namespace: process.env.TEMPORAL_NAMESPACE || 'default',
        address: process.env.TEMPORAL_ADDRESS,
      });

      // const vendorConfigs = await loadVendorConfigs(); // You'd need a way to load these
      // const specificVendorToRun = vendorConfigs.find(vc => vc.id === 'some-vendor-id');
      
      // if (specificVendorToRun) {
      //   console.log(`Standalone: Attempting to run crawler for ${specificVendorToRun.displayName}`);
      //   await runCrawlers([specificVendorToRun], temporalClient, { forceRecrawlAll: false });
      // } else {
      //   console.log('Standalone: No specific vendor configured for standalone run or vendor not found.');
      // }

    } catch (error) {
      console.error('Error in standalone crawler execution example:', error);
      process.exit(1);
    }
  }
  */
}

main().catch((err) => {
  console.error('Unhandled error in crawler index:', err);
  process.exit(1);
}); 