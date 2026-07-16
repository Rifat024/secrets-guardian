export * from './types';
export { scan } from './scan';
export type { ScanOptions } from './scan';
export { detectInFile } from './detector';
export { readBaseline, writeBaseline, diffAgainstBaseline, mergeIntoBaseline, DEFAULT_BASELINE_FILE } from './baseline';
export { scanToMarkdown } from './report';
export { workflowYaml } from './workflowTemplate';
export { redact, fingerprint } from './redact';
export { shannonEntropy, looksLikeSecret, looksLikePlaceholder } from './entropy';
