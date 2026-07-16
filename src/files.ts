import { run } from './exec';

export type GitRunner = (args: string[], cwd: string) => Promise<string>;

export const defaultGitRunner: GitRunner = (args, cwd) => run('git', args, cwd);

function splitLines(output: string): string[] {
  return output.split('\n').filter(Boolean);
}

/** Every tracked file plus untracked-but-not-ignored files — i.e. everything `git add .` would pick up. */
export async function listWorkingTreeFiles(cwd: string, git: GitRunner = defaultGitRunner): Promise<string[]> {
  const [tracked, untracked] = await Promise.all([
    git(['ls-files'], cwd).then(splitLines).catch(() => []),
    git(['ls-files', '--others', '--exclude-standard'], cwd).then(splitLines).catch(() => []),
  ]);
  return [...new Set([...tracked, ...untracked])];
}

/** Files staged for the next commit — used by the pre-commit hook / `--staged`. */
export async function listStagedFiles(cwd: string, git: GitRunner = defaultGitRunner): Promise<string[]> {
  const output = await git(['diff', '--cached', '--name-only', '--diff-filter=ACM'], cwd).catch(() => '');
  return splitLines(output);
}
