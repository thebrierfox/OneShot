import { WorkflowClient } from '@temporalio/client';

(async () => {
  const client = new WorkflowClient();
  const id = `oneshot-${Date.now()}`;
  console.log('Starting main workflow with id', id);
  const handle = await client.start('main', {
    workflowId: id,
    taskQueue: process.env.TEMPORAL_TASK_QUEUE_MAIN || 'main',
  });
  console.log('Workflow started, waiting for result...');
  const result = await handle.result();
  console.log('Workflow result:', result);
  process.exit(0);
})(); 