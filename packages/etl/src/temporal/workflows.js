"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.etlWorkflow = exports.etlProcessWorkflow = void 0;
const workflow_1 = require("@temporalio/workflow");
const { etlProcessActivity } = (0, workflow_1.proxyActivities)({
    startToCloseTimeout: '5 minute',
    retry: {
        maximumAttempts: 3,
    },
});
/**
 * Temporal Workflow to manage the ETL processing of a single raw scraped product.
 * This workflow calls the `etlProcessActivity` and handles its outcome.
 *
 * @param rawProduct The raw product data scraped from a vendor website.
 * @param vendorConfig Optional configuration for the vendor, passed to the activity for normalization.
 * @returns A promise resolving to the result of the ETL activity, or throws an ApplicationFailure on error.
 */
async function etlProcessWorkflow(rawProduct, vendorConfig) {
    workflow_1.log.info('Starting etlProcessWorkflow', {
        url: rawProduct.url,
        vendorId: rawProduct.vendorId,
        hasVendorConfig: !!vendorConfig
    });
    try {
        const result = await etlProcessActivity(rawProduct, vendorConfig);
        workflow_1.log.info('etlProcessWorkflow completed successfully.');
        return result;
    }
    catch (e) {
        if (e instanceof workflow_1.ApplicationFailure) {
            workflow_1.log.error('ETL workflow failed with ApplicationFailure', { name: e.name, message: e.message, type: e.type });
            throw e; // Re-throw ApplicationFailure as is
        }
        workflow_1.log.error('ETL workflow failed with an unexpected error', { error: e });
        throw workflow_1.ApplicationFailure.create({
            message: 'Unexpected error in etlProcessWorkflow',
            type: 'WorkflowError',
            nonRetryable: true,
            cause: e,
        });
    }
}
exports.etlProcessWorkflow = etlProcessWorkflow;
exports.etlWorkflow = etlProcessWorkflow;
//# sourceMappingURL=workflows.js.map