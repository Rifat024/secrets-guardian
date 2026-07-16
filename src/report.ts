import type { Finding, ScanResult } from './types';

function line(finding: Finding): string {
  return `- **${finding.ruleName}** (\`${finding.ruleId}\`) in \`${finding.file}:${finding.line}\` — \`${finding.preview}\``;
}

export function scanToMarkdown(result: ScanResult): string {
  const lines = [
    '# secrets-guardian scan report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `Files scanned: ${result.filesScanned}`,
    `Findings: ${result.findings.length}`,
    `Unapproved: ${result.unapproved.length}`,
    '',
  ];

  if (result.unapproved.length === 0) {
    lines.push('No unapproved secrets found.');
    return lines.join('\n');
  }

  lines.push(
    '## Unapproved findings',
    '',
    'Values are redacted. If a finding is a false positive or an already-rotated',
    'key kept for test fixtures, run `secrets-guardian approve` after confirming',
    'it is safe — otherwise, rotate the real credential and remove it from the file.',
    '',
    ...result.unapproved.map(line),
  );

  return lines.join('\n');
}
