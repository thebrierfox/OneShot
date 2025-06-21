import * as dotenv from 'dotenv';
import path from 'path';
import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function run() {
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
  });

  const worker = await Worker.create({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE || 'default',
    taskQueue: process.env.TEMPORAL_TASK_QUEUE_REPORT || 'report',
    workflowsPath: require.resolve('./workflows'),
    activities,
  });

  console.log(`[report] worker started on task queue ${worker.options.taskQueue}`);
  await worker.run();
}

run().catch((err) => {
  console.error('[report] worker failed:', err);
  process.exit(1);
}); 