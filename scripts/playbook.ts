#!/usr/bin/env ts-node
/*
 * Entry point for executing a single vendor playbook. This script is invoked by
 * `npm run playbook:<vendor>` where `<vendor>` is a key in the playbooks folder.
 *
 * It orchestrates the scrape → ETL → report pipeline using Temporal workflows.
 * Currently this is a placeholder implementation; it merely prints the vendor
 * name. Full integration with Temporal will require importing the client
 * API from the `@patriot-rentals/orchestrator` package and passing the vendor
 * plan to a workflow.
 */

const vendor = process.argv[2];

if (!vendor) {
  console.error('Usage: pnpm ts-node scripts/playbook.ts <vendor>');
  process.exit(1);
}

async function run() {
  console.log(`Starting playbook for vendor: ${vendor}`);
  // TODO: Load playbook plan from playbooks/<vendor>/plan.md
  // TODO: Call orchestrator workflow with vendor plan and handle needsAgent codes.
  console.log('Placeholder: pipeline execution not yet implemented.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});