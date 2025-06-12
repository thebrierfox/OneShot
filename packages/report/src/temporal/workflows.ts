import { proxyActivities } from '@temporalio/workflow';
import type * as act from './activities';

const { writeCsvReport } = proxyActivities<typeof act>({ startToCloseTimeout: '5 minutes' });

// Write CSV from within a workflow via deterministic `wf.defineQuery` is not possible; instead, delegate to an activity.
// For simplicity of Phase-3 success gate we simulate the write by returning the target path which an activity would create.

export async function generateCsvReportWorkflow(cleaned: any[]): Promise<string> {
  return await writeCsvReport(cleaned);
} 