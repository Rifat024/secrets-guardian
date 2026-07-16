import { detectInFile } from './detector';
import { listStagedFiles, listWorkingTreeFiles, type GitRunner } from './files';
import { readBaseline, diffAgainstBaseline, DEFAULT_BASELINE_FILE } from './baseline';
import type { ScanResult } from './types';

export interface ScanOptions {
  /** Scan only git-staged files (pre-commit use case) instead of the whole working tree. */
  staged?: boolean;
  baselineFile?: string;
  git?: GitRunner;
}

export async function scan(root: string, options: ScanOptions = {}): Promise<ScanResult> {
  const files = options.staged ? await listStagedFiles(root, options.git) : await listWorkingTreeFiles(root, options.git);

  const results = await Promise.all(files.map((file) => detectInFile(root, file)));
  const findings = results.flat();

  const baseline = await readBaseline(root, options.baselineFile ?? DEFAULT_BASELINE_FILE);
  const unapproved = diffAgainstBaseline(findings, baseline);

  return { findings, unapproved, filesScanned: files.length };
}
