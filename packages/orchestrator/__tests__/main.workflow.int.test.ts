import { Worker, DefaultLogger, Runtime } from '@temporalio/worker';
import { WorkflowClient } from '@temporalio/client';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { v4: uuid } = require('uuid');
import * as workflows from '../src/workflows/main.workflow';

const shouldRun =
  !process.env.npm_package_name || process.env.npm_package_name === '@patriot-rentals/orchestrator';

// Increase timeout because Temporal worker startup may take ~10s in CI
jest.setTimeout(30_000);

describe(
  'main.workflow integration (Temporal in-memory)',
  shouldRun ? () => {
    it('registers workflow code without throwing', async () => {
      // Configure Temporal runtime logger to avoid verbose output in CI.
      Runtime.install({ logger: new DefaultLogger('WARN') });

      const taskQueue = `test-${uuid()}`;

      const worker = await Worker.create({
        workflowsPath: require.resolve('../src/workflows/main.workflow'),
        taskQueue,
        bundlerOptions: {
          ignoreModules: ['fs', 'path', 'fs-extra', 'yaml'],
        },
      });

      const client = new WorkflowClient();

      expect(worker).toBeDefined();
      expect(client).toBeDefined();

      // Start and immediately shut down to free resources.
      await worker.runUntil(Promise.resolve());
    });
  }
  : () => {
      it.skip('skipped in non-orchestrator packages', () => {
        /* intentionally skipped to avoid duplicate execution */
      });
    }
); 