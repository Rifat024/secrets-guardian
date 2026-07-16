import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type { Baseline, Finding } from './types';
import { baselineKey } from './types';

export const DEFAULT_BASELINE_FILE = '.secrets-guardian-allowlist.json';

export async function readBaseline(root: string, filename = DEFAULT_BASELINE_FILE): Promise<Baseline> {
  try {
    const raw = await fs.readFile(join(root, filename), 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.approved)) throw new Error('malformed baseline');
    return { approved: parsed.approved };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return { approved: [] };
    throw new Error(`Could not read ${filename}: ${err instanceof Error ? err.message : err}`);
  }
}

export async function writeBaseline(root: string, baseline: Baseline, filename = DEFAULT_BASELINE_FILE): Promise<void> {
  const sorted = { approved: [...new Set(baseline.approved)].sort() };
  await fs.writeFile(join(root, filename), JSON.stringify(sorted, null, 2) + '\n', 'utf8');
}

export function diffAgainstBaseline(findings: Finding[], baseline: Baseline): Finding[] {
  const approved = new Set(baseline.approved);
  return findings.filter((finding) => !approved.has(baselineKey(finding)));
}

export function mergeIntoBaseline(baseline: Baseline, findings: Finding[]): Baseline {
  const approved = new Set(baseline.approved);
  for (const finding of findings) approved.add(baselineKey(finding));
  return { approved: [...approved] };
}
