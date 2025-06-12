import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';

const program = new Command();
program
  .argument('<vendor>', 'Vendor ID (e.g. sunbelt)')
  .argument('<sku>', 'Product SKU identifier (e.g. 857)')
  .parse(process.argv);

const [vendor, sku] = program.args as [string, string];

(async () => {
  try {
    const rootExamplePath = path.resolve(process.cwd(), 'examples', `${vendor}-${sku}.json`);
    const examplePath = await fs.pathExists(rootExamplePath)
      ? rootExamplePath
      : path.resolve(__dirname, '../../examples', `${vendor}-${sku}.json`);
    if (await fs.pathExists(examplePath)) {
      const jsonContent = await fs.readFile(examplePath, 'utf8');
      console.log(jsonContent);
      return;
    }

    console.error('Example data not found for given vendor/sku. Implement live scraping to fetch real data.');
    process.exitCode = 1;
  } catch (err) {
    console.error('CLI execution failed:', err);
    process.exitCode = 1;
  }
})(); 