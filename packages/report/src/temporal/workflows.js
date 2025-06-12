"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCsvReportWorkflow = void 0;
const workflow_1 = require("@temporalio/workflow");
const { writeCsvReport } = (0, workflow_1.proxyActivities)({ startToCloseTimeout: '5 minutes' });
// Write CSV from within a workflow via deterministic `wf.defineQuery` is not possible; instead, delegate to an activity.
// For simplicity of Phase-3 success gate we simulate the write by returning the target path which an activity would create.
async function generateCsvReportWorkflow(cleaned) {
    return await writeCsvReport(cleaned);
}
exports.generateCsvReportWorkflow = generateCsvReportWorkflow;
//# sourceMappingURL=workflows.js.map