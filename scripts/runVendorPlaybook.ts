#!/usr/bin/env ts-node
/*
 * Runner script that pulls the latest code, executes a vendor playbook, then
 * commits and pushes any new artefacts. This script is intended for use by
 * scheduled tasks (cron or Task Scheduler).
 *
 * NOTE: This is a placeholder implementation. It does not yet execute
 * Temporal workflows or handle agent triggers. It uses simple-git to
 * perform basic version control operations.
 */

import { simpleGit } from 'simple-git';
import { execSync } from 'child_process';

const vendor = process.argv[2];
if (!vendor) {
  console.error('Usage: pnpm ts-node scripts/runVendorPlaybook.ts <vendor>');
  process.exit(1);
}

async function run() {
  const git = simpleGit();
  // Pull latest changes
  await git.pull('origin', 'main');

  // Run the playbook for the vendor
  console.log(`Executing playbook for ${vendor}...`);
  try {
    execSync(`pnpm ts-node scripts/playbook.ts ${vendor}`, { stdio: 'inherit' });
  } catch (err) {
    console.error('Playbook execution failed:', err);
  }

  // Stage and commit any new artefacts under playbooks/<vendor>/runs/
  await git.add([`playbooks/${vendor}/runs/**/*`]);
  const commitMessage = `chore(playbook): update artefacts for ${vendor}`;
  await git.commit(commitMessage);
  await git.push('origin', 'main');

  console.log('Playbook run complete.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});