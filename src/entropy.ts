/** Shannon entropy in bits per character. Random-looking secrets score high; English words/placeholders score low. */
export function shannonEntropy(value: string): number {
  if (value.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const ch of value) counts.set(ch, (counts.get(ch) ?? 0) + 1);

  let entropy = 0;
  for (const count of counts.values()) {
    const p = count / value.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

const PLACEHOLDER_MARKERS = [
  /^x+$/i,
  /^changeme$/i,
  /^example/i,
  /^replace/i,
  /^your[_-]/i,
  /^<.*>$/,
  /^\$\{.*\}$/,
  /^process\.env/,
  /^\*+$/,
  /^dummy/i,
  /^fake/i,
  /^test[_-]?(key|secret|token)?$/i,
  /^placeholder/i,
  /^todo/i,
  /^null$|^undefined$|^none$/i,
];

export function looksLikePlaceholder(value: string): boolean {
  return PLACEHOLDER_MARKERS.some((re) => re.test(value.trim()));
}

/**
 * A generic KEY=/SECRET= assignment is only worth flagging if the value
 * looks random (high entropy, no spaces, not a placeholder) — otherwise
 * almost every codebase's test fixtures and .env.example files would trip
 * this on every scan.
 */
export function looksLikeSecret(value: string): boolean {
  if (looksLikePlaceholder(value)) return false;
  if (/\s/.test(value)) return false;
  return shannonEntropy(value) >= 3.5;
}
