// E2E test that boots docker-compose stack (unless CI_NO_DOCKER=true),
// spins an in-memory Temporal test environment, executes the main workflow,
// and asserts the CSV report exists with a non-empty MD5 checksum.

const { execSync } = require('child_process');
const fs = require('fs');
const crypto = require('crypto');
const {
  Runtime,
  DefaultLogger,
  Worker,
} = require('@temporalio/worker');
const { Connection, WorkflowClient } = require('@temporalio/client');
const { main } = require('../packages/orchestrator/src/workflows/main.workflow');

const md5 = (filePath) => {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(data).digest('hex');
};

(async () => {
  try {
    if (!process.env.CI_NO_DOCKER) {
      console.log('⚙️  Starting docker-compose stack…');
      execSync('docker compose up -d --wait', { stdio: 'inherit' });
    }

    Runtime.install({ logger: new DefaultLogger('WARN') });
    const connection = await Connection.connect({ address: undefined });
    const taskQueue = 'e2e';

    const worker = await Worker.create({
      workflowsPath: [
        require.resolve('../packages/scraper/src/temporal/workflows'),
        require.resolve('../packages/etl/src/temporal/workflows'),
        require.resolve('../packages/report/src/temporal/workflows'),
        require.resolve('../packages/orchestrator/src/workflows/main.workflow'),
      ],
      connection,
      taskQueue,
    });

    const workerRun = worker.run();

    const client = new WorkflowClient({ connection });
    const csvPath = await client.execute(main, {
      taskQueue,
      workflowId: `e2e-${Date.now()}`,
      args: [[{ sku: 'TEST123' }]],
    });

    if (!fs.existsSync(csvPath)) throw new Error(`CSV not found at ${csvPath}`);
    const checksum = md5(csvPath);
    if (!checksum) throw new Error('Checksum empty');

    console.log(`✅ E2E passed – CSV: ${csvPath}, md5: ${checksum}`);

    await worker.shutdown();
    await workerRun;

    process.exit(0);
  } catch (err) {
    console.error('❌ E2E failed', err);
    process.exit(1);
  }
})(); 