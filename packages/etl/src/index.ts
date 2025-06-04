import 'dotenv/config'; // Ensures .env is loaded at the very start
import { Worker, NativeConnection, Runtime, DefaultLogger } from '@temporalio/worker';
import * as activities from './temporal/activities';

async function runEtlWorker() {
  // Configure logger for more detailed output if needed, e.g., during development
  // Runtime.instance().logger = new DefaultLogger('DEBUG'); // Or 'INFO', 'WARN', 'ERROR'

  const temporalAddress = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
  const temporalNamespace = process.env.TEMPORAL_NAMESPACE || 'default';
  const taskQueue = process.env.TEMPORAL_TASK_QUEUE_ETL || 'etl-task-queue';

  console.log(`
    Attempting to start ETL Worker with the following configuration:
    Temporal Address: ${temporalAddress}
    Temporal Namespace: ${temporalNamespace}
    Task Queue: ${taskQueue}
  `);

  try {
    const connection = await NativeConnection.create({
      address: temporalAddress,
      // tls: {}, // Configure TLS if connecting to a secure Temporal cluster
    });
    console.log('Successfully connected to Temporal.');

    const worker = await Worker.create({
      connection,
      namespace: temporalNamespace,
      taskQueue,
      activities, // Register all exported functions from activities.ts
      // workflowsPath: require.resolve('./temporal/workflows') // Optional: if your bundler doesn't pick them up
                                                              // Or if you want to explicitly define where workflows are.
                                                              // For most setups, if workflows are started by name by a client,
                                                              // and activities are correctly registered, this might not be strictly needed.
    });
    console.log('ETL Worker created. Running...');

    await worker.run();
    console.log('ETL Worker shut down gracefully.');
    await connection.close();
  } catch (err) {
    console.error('Failed to start or run ETL Worker:', err);
    process.exit(1);
  }
}

runEtlWorker().catch((err) => {
  console.error('Unhandled error in runEtlWorker:', err);
  process.exit(1);
}); 