import path from 'path';
import { Worker, NativeConnection } from '@temporalio/worker';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function run() {
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
  });

  const worker = await Worker.create({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE || 'default',
    taskQueue: process.env.TEMPORAL_TASK_QUEUE_MAIN || 'main',
    workflowsPath: require.resolve('./workflows/main.workflow'),
    bundlerOptions: { ignoreModules: ['fs', 'path'] },
  });

  console.log(`[orchestrator] worker started on task queue ${worker.options.taskQueue}`);
  await worker.run();
}

run().catch((err) => {
  console.error('[orchestrator] worker failed', err);
  process.exit(1);
}); 