import assert from 'node:assert';
import { test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readBaseline, writeBaseline, diffAgainstBaseline, mergeIntoBaseline } from './baseline';
import type { Finding } from './types';

const finding = (ruleId: string, fingerprint: string): Finding => ({
  ruleId,
  ruleName: 'Test Rule',
  file: 'config.js',
  line: 1,
  preview: 'ab**cd',
  fingerprint,
});

test('readBaseline returns an empty baseline when the file does not exist', async () => {
  const root = await mkdtemp(join(tmpdir(), 'sg-baseline-'));
  try {
    assert.deepEqual(await readBaseline(root), { approved: [] });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('writeBaseline then readBaseline round-trips and dedupes/sorts', async () => {
  const root = await mkdtemp(join(tmpdir(), 'sg-baseline-'));
  try {
    await writeBaseline(root, { approved: ['ruleB:222', 'ruleA:111', 'ruleA:111'] });
    const baseline = await readBaseline(root);
    assert.deepEqual(baseline.approved, ['ruleA:111', 'ruleB:222']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('the baseline file never contains a raw secret, only rule id + fingerprint', async () => {
  const root = await mkdtemp(join(tmpdir(), 'sg-baseline-'));
  try {
    await writeBaseline(root, mergeIntoBaseline({ approved: [] }, [finding('aws-access-key-id', 'deadbeef12345678')]));
    const baseline = await readBaseline(root);
    assert.deepEqual(baseline.approved, ['aws-access-key-id:deadbeef12345678']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('diffAgainstBaseline returns only unapproved findings', () => {
  const findings = [finding('rule-a', '111'), finding('rule-b', '222')];
  const unapproved = diffAgainstBaseline(findings, { approved: ['rule-a:111'] });
  assert.equal(unapproved.length, 1);
  assert.equal(unapproved[0].fingerprint, '222');
});

test('mergeIntoBaseline adds without duplicating', () => {
  const merged = mergeIntoBaseline({ approved: ['rule-a:111'] }, [finding('rule-a', '111'), finding('rule-b', '222')]);
  assert.deepEqual([...merged.approved].sort(), ['rule-a:111', 'rule-b:222']);
});
