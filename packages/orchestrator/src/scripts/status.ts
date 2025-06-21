import { WorkflowClient, Connection } from '@temporalio/client';

(async () => {
  const names = [
    'UNSPEC',
    'Running',
    'Completed',
    'Failed',
    'Canceled',
    'Terminated',
    'ContinuedAsNew',
    'TimedOut',
  ];

  const mainId = process.argv[2];
  if (!mainId) {
    console.error('Usage: ts-node src/scripts/status.ts <workflowId>');
    process.exit(1);
  }

  try {
    // Establish a connection compatible with newer @temporalio/client typings
    const connection = await Connection.connect({ address: 'localhost:7233' });
    const client = new WorkflowClient({ connection });

    // Newer SDKs renamed `executionInfo` → `workflowExecutionInfo`.  Fall back gracefully.
    const desc = (await client.getHandle(mainId).describe()) as any;
    const info = desc.executionInfo ?? desc.workflowExecutionInfo ?? desc;
    console.log(`${mainId}  ${names[info.status]}`);
  } catch (err: unknown) {
    const e = err as any;
    console.error('Unable to describe workflow:', e?.message ?? e);
    process.exit(1);
  }
})(); 