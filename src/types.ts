export interface Finding {
  ruleId: string;
  ruleName: string;
  file: string;
  line: number;
  /** Redacted — never the raw secret. See redact(). */
  preview: string;
  /** sha256 of the raw matched value, used for baseline fingerprinting without storing the secret. */
  fingerprint: string;
}

export interface ScanResult {
  findings: Finding[];
  unapproved: Finding[];
  filesScanned: number;
}

export interface Baseline {
  /** Set of "ruleId:fingerprint" strings for reviewed-and-accepted findings (e.g. rotated keys, fixtures). */
  approved: string[];
}

export function baselineKey(finding: Pick<Finding, 'ruleId' | 'fingerprint'>): string {
  return `${finding.ruleId}:${finding.fingerprint}`;
}
