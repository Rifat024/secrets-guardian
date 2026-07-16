import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { KNOWN_PATTERNS, GENERIC_ASSIGNMENT_PATTERN } from './patterns';
import { looksLikeSecret } from './entropy';
import { redact, fingerprint } from './redact';
import type { Finding } from './types';

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.pdf', '.zip', '.gz', '.tar',
  '.woff', '.woff2', '.ttf', '.eot', '.mp3', '.mp4', '.mov', '.wasm', '.exe', '.dll', '.so', '.dylib',
]);

function isLikelyBinary(path: string): boolean {
  const ext = path.slice(path.lastIndexOf('.')).toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

function lineNumberAt(content: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index; i++) {
    if (content[i] === '\n') line++;
  }
  return line;
}

export async function detectInFile(root: string, relativePath: string): Promise<Finding[]> {
  if (isLikelyBinary(relativePath)) return [];

  let content: string;
  try {
    content = await fs.readFile(join(root, relativePath), 'utf8');
  } catch {
    return [];
  }
  // A null byte this early is a strong binary signal even without a recognized extension.
  if (content.slice(0, 512).includes('\0')) return [];

  const findings: Finding[] = [];

  for (const pattern of KNOWN_PATTERNS) {
    pattern.regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.regex.exec(content))) {
      const value = match[1] ?? match[0];
      findings.push({
        ruleId: pattern.id,
        ruleName: pattern.name,
        file: relativePath,
        line: lineNumberAt(content, match.index),
        preview: redact(value),
        fingerprint: fingerprint(value),
      });
    }
  }

  // A value already caught by a known-format rule shouldn't also be reported
  // generically — same secret, redundant finding.
  const alreadyFound = new Set(findings.map((f) => f.fingerprint));

  GENERIC_ASSIGNMENT_PATTERN.lastIndex = 0;
  let genericMatch: RegExpExecArray | null;
  while ((genericMatch = GENERIC_ASSIGNMENT_PATTERN.exec(content))) {
    const value = genericMatch[1];
    if (!looksLikeSecret(value)) continue;
    const fp = fingerprint(value);
    if (alreadyFound.has(fp)) continue;
    findings.push({
      ruleId: 'generic-high-entropy-assignment',
      ruleName: 'Generic high-entropy assignment',
      file: relativePath,
      line: lineNumberAt(content, genericMatch.index),
      preview: redact(value),
      fingerprint: fp,
    });
  }

  return findings;
}
