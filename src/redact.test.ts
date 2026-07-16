import assert from 'node:assert';
import { test } from 'node:test';
import { redact, fingerprint } from './redact';

test('redact shows only the first and last 4 characters', () => {
  const value = 'AKIAABCDEFGHIJKLMNOP';
  const out = redact(value);
  assert.ok(out.startsWith('AKIA'));
  assert.ok(out.endsWith('MNOP'));
  assert.ok(!out.includes('ABCDEFGHIJKL'));
  assert.ok(!out.includes(value));
});

test('redact fully masks very short values', () => {
  assert.equal(redact('short'), '*****');
});

test('fingerprint is deterministic and does not reproduce the input', () => {
  const value = 'super-secret-value-12345';
  const fp1 = fingerprint(value);
  const fp2 = fingerprint(value);
  assert.equal(fp1, fp2);
  assert.ok(!fp1.includes(value));
});

test('fingerprint differs for different values', () => {
  assert.notEqual(fingerprint('secret-a'), fingerprint('secret-b'));
});
