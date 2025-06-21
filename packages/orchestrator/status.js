const { WorkflowClient } = require('@temporalio/client');

(async () => {
  const names = ['UNSPEC', 'Running', 'Completed', 'Failed', 'Canceled', 'Terminated', 'ContinuedAsNew', 'TimedOut'];
  const client = new WorkflowClient({ connection: { address: 'localhost:7233' } });

  let main = null;
  for await (const wf of client.list({ query: 'WorkflowType="main" ORDER BY StartTime DESC LIMIT 1' })) {
    main = wf;
    break;
  }

  if (!main) {
    console.log('No main workflow found');
    process.exit(0);
  }

  const mainId = main.execution.executionId.workflowId;
  const desc = await client.getHandle(mainId).describe();
  console.log(`${mainId}  ${names[desc.executionInfo.status]}`);

  for await (const wf of client.list({ query: `ParentWorkflowId='${mainId}'` })) {
    const status = names[wf.status ?? wf.closeStatus ?? wf.executionInfo?.status ?? 0];
    console.log(`  ${wf.execution.executionId.workflowId}  ${status}`);
  }

  process.exit(0);
})();
