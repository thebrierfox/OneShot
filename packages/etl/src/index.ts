import * as dotenv from 'dotenv';
import path from 'path';
import { Worker, NativeConnection, Runtime, DefaultLogger } from '@temporalio/worker';
import * as activities from './temporal/activities';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function runEtlWorker() {
  // Configure logger for more detailed output if needed, e.g., during development
  // Runtime.instance().logger = new DefaultLogger('DEBUG'); // Or 'INFO', 'WARN', 'ERROR'

  const temporalAddress = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
  const temporalNamespace = process.env.TEMPORAL_NAMESPACE || 'default';
  const taskQueue = process.env.TEMPORAL_TASK_QUEUE_ETL || 'patriot-etl-tq';

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
      activities, // Register all exported activity functions
      workflowsPath: require.resolve('./temporal/workflows'), // Ensure ETL workflows are bundled & registered
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