import { createHash } from 'node:crypto';

/** Shows just enough to identify the secret in a report without reproducing it. */
export function redact(value: string): string {
  if (value.length <= 8) return '*'.repeat(value.length);
  return `${value.slice(0, 4)}${'*'.repeat(Math.min(value.length - 8, 20))}${value.slice(-4)}`;
}

export function fingerprint(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}
