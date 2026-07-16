export interface Pattern {
  id: string;
  name: string;
  /** Must have a single capture group around the secret value itself. */
  regex: RegExp;
}

/**
 * Known-format detectors, ordered roughly by specificity. Each regex's first
 * capture group is the value that gets fingerprinted/redacted — never the
 * whole matched line.
 */
export const KNOWN_PATTERNS: Pattern[] = [
  { id: 'aws-access-key-id', name: 'AWS Access Key ID', regex: /\b((?:AKIA|ASIA|AIDA|AROA|AGPA|AIPA|ANPA|ANVA)[A-Z0-9]{16})\b/g },
  { id: 'aws-secret-key', name: 'AWS Secret Access Key (heuristic)', regex: /aws(.{0,20})?(?:secret|private)[_-]?(?:access)?[_-]?key(.{0,20})?['"]\s*[:=]\s*['"]([A-Za-z0-9/+=]{40})['"]/gi },
  { id: 'github-pat', name: 'GitHub Personal Access Token', regex: /\b(ghp_[A-Za-z0-9]{36})\b/g },
  { id: 'github-oauth', name: 'GitHub OAuth Token', regex: /\b(gho_[A-Za-z0-9]{36})\b/g },
  { id: 'github-app-token', name: 'GitHub App/Refresh Token', regex: /\b((?:ghu|ghs|ghr)_[A-Za-z0-9]{36,255})\b/g },
  { id: 'github-fine-grained-pat', name: 'GitHub Fine-Grained PAT', regex: /\b(github_pat_[A-Za-z0-9_]{22,255})\b/g },
  { id: 'gitlab-pat', name: 'GitLab Personal Access Token', regex: /\b(glpat-[A-Za-z0-9_-]{20})\b/g },
  { id: 'slack-token', name: 'Slack Token', regex: /\b(xox[baprs]-[A-Za-z0-9-]{10,72})\b/g },
  { id: 'slack-webhook', name: 'Slack Webhook URL', regex: /(https:\/\/hooks\.slack\.com\/services\/T[A-Za-z0-9]+\/B[A-Za-z0-9]+\/[A-Za-z0-9]+)/g },
  { id: 'stripe-live-key', name: 'Stripe Live API Key', regex: /\b((?:sk|rk)_live_[A-Za-z0-9]{20,247})\b/g },
  { id: 'google-api-key', name: 'Google API Key', regex: /\b(AIza[A-Za-z0-9_-]{35})\b/g },
  { id: 'npm-token', name: 'npm Access Token', regex: /\b(npm_[A-Za-z0-9]{36})\b/g },
  { id: 'anthropic-key', name: 'Anthropic API Key', regex: /\b(sk-ant-[A-Za-z0-9_-]{20,120})\b/g },
  { id: 'openai-key', name: 'OpenAI API Key', regex: /\b(sk-[A-Za-z0-9]{20}T3BlbkFJ[A-Za-z0-9]{20})\b/g },
  { id: 'twilio-key', name: 'Twilio API Key', regex: /\b(SK[a-f0-9]{32})\b/g },
  { id: 'sendgrid-key', name: 'SendGrid API Key', regex: /\b(SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43})\b/g },
  { id: 'private-key-block', name: 'Private Key Block', regex: /(-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]{0,4000}?-----END (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----)/g },
  { id: 'jwt', name: 'JSON Web Token', regex: /\b(eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})\b/g },
  { id: 'generic-bearer', name: 'Generic Bearer Token', regex: /[Bb]earer\s+([A-Za-z0-9_\-.=]{20,})/g },
];

/**
 * Catches KEY=/SECRET=/TOKEN=/PASSWORD=-style assignments that don't match a
 * known provider format. The entropy check (see entropy.ts) is what keeps
 * this from flagging every placeholder like KEY="your-key-here".
 */
export const GENERIC_ASSIGNMENT_PATTERN =
  /\b[A-Za-z0-9_]*(?:SECRET|TOKEN|API[_-]?KEY|ACCESS[_-]?KEY|PRIVATE[_-]?KEY|PASSWORD|CREDENTIAL)[A-Za-z0-9_]*\s*[:=]\s*['"]([^'"\s]{12,200})['"]/gi;
