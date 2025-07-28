import { SimpleGit, simpleGit } from 'simple-git';

/**
 * Returns a SimpleGit instance bound to the repository root.
 */
export function getGit(): SimpleGit {
  return simpleGit();
}

/**
 * Stages a list of file globs and commits with the given message. Returns the commit hash.
 */
export async function commitFiles(files: string | string[], message: string): Promise<string> {
  const git = getGit();
  await git.add(files);
  const commit = await git.commit(message);
  return commit.commit; // return hash
}

/**
 * Pushes the current branch to origin. Returns result summary.
 */
export async function push(): Promise<void> {
  const git = getGit();
  await git.push('origin', 'main');
}