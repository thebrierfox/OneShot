import * as dotenv from 'dotenv';
import { NativeConnection, Worker } from '@temporalio/worker';
import { Context as ActivityContext } from '@temporalio/activity'; // Corrected import for 'activity' and alias
import * as activities from './temporal/activities';
import * as workflows from './temporal/workflows';

dotenv.config();

async function runWorker() {
  if (!process.env.TEMPORAL_ADDRESS) {
    console.error('TEMPORAL_ADDRESS environment variable is not set.');
    process.exit(1);
  }
  if (!process.env.TEMPORAL_TASK_QUEUE_SCRAPER) {
    console.error('TEMPORAL_TASK_QUEUE_SCRAPER environment variable is not set.');
    process.exit(1);
  }

  // Create a new NativeConnection to the Temporal server.
  // Note: getTemporalClient() from client.ts is for client-side operations (starting workflows),
  // workers typically manage their own connections or use a shared one configured for worker needs.
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS,
    // Potential TLS configuration for production would go here
  });

  // Create a Worker to host activities and workflows.
  const worker = await Worker.create({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE || 'default',
    taskQueue: process.env.TEMPORAL_TASK_QUEUE_SCRAPER,
    workflowsPath: require.resolve('./temporal/workflows'), // Path to compiled JS files
    activities,
    // Graceful shutdown options, etc.
    shutdownGraceTime: '1m',
  });

  console.log(`Scraper worker started. Listening on task queue: ${process.env.TEMPORAL_TASK_QUEUE_SCRAPER}`);

  // Start the worker's polling loop.
  try {
    await worker.run();
  } catch (err) {
    console.error('Scraper worker failed', err);
    // Ensure connection is closed on failure, though worker.run() should handle it.
    await connection.close().catch(closeErr => console.error('Failed to close connection after worker error:', closeErr));
    process.exit(1);
  }
  // If worker.run() completes (e.g., due to cancellation signal), close connection.
  await connection.close().catch(closeErr => console.error('Failed to close connection after worker run completion:', closeErr));
}

runWorker().catch((err) => {
  console.error('Error running scraper worker:', err);
  process.exit(1);
}); 