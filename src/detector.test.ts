import assert from 'node:assert';
import { test } from 'node:test';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { detectInFile } from './detector';

async function withTempFile(content: string, fn: (root: string, relPath: string) => Promise<void>) {
  const root = await mkdtemp(join(tmpdir(), 'sg-'));
  try {
    const relPath = 'config.js';
    await writeFile(join(root, relPath), content, 'utf8');
    await fn(root, relPath);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('detects an AWS access key id', () =>
  withTempFile(`const key = "AKIAIOSFODNN7EXAMPLE";`, async (root, relPath) => {
    const findings = await detectInFile(root, relPath);
    assert.equal(findings.length, 1);
    assert.equal(findings[0].ruleId, 'aws-access-key-id');
    assert.ok(!findings[0].preview.includes('IOSFODNN7EXAMPLE'));
  }));

test('detects a GitHub personal access token', () =>
  withTempFile(`GITHUB_TOKEN=ghp_1234567890abcdefghijklmnopqrstuvwxyz`, async (root, relPath) => {
    const findings = await detectInFile(root, relPath);
    assert.equal(findings.some((f) => f.ruleId === 'github-pat'), true);
  }));

test('detects a private key block', () =>
  withTempFile(
    `-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA1234567890abcdef\n-----END RSA PRIVATE KEY-----`,
    async (root, relPath) => {
      const findings = await detectInFile(root, relPath);
      assert.equal(findings.some((f) => f.ruleId === 'private-key-block'), true);
    },
  ));

test('flags a generic high-entropy assignment', () =>
  withTempFile(`const apiSecret = "kX9pL2mQ7zR4vN8wYt3BcD6f";`, async (root, relPath) => {
    const findings = await detectInFile(root, relPath);
    assert.equal(findings.some((f) => f.ruleId === 'generic-high-entropy-assignment'), true);
  }));

test('does not flag placeholder-style assignments', () =>
  withTempFile(`const apiSecret = "your-secret-key-here";\nconst token = "changeme";`, async (root, relPath) => {
    const findings = await detectInFile(root, relPath);
    assert.deepEqual(findings, []);
  }));

test('does not double-report a known-format value under the generic rule too', () =>
  withTempFile(`const AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE";`, async (root, relPath) => {
    const findings = await detectInFile(root, relPath);
    assert.equal(findings.length, 1);
    assert.equal(findings[0].ruleId, 'aws-access-key-id');
  }));

test('never includes the raw secret value in the finding preview', () =>
  withTempFile(`const key = "AKIAIOSFODNN7EXAMPLE";`, async (root, relPath) => {
    const findings = await detectInFile(root, relPath);
    for (const f of findings) {
      assert.ok(!f.preview.includes('IOSFODNN7EXAMPLE'));
    }
  }));

test('skips files with a binary extension', () =>
  withTempFile(`AKIAIOSFODNN7EXAMPLE`, async (root) => {
    const findings = await detectInFile(root, 'image.png');
    assert.deepEqual(findings, []);
  }));

test('returns no findings for a clean file', () =>
  withTempFile(`export function add(a, b) { return a + b; }`, async (root, relPath) => {
    const findings = await detectInFile(root, relPath);
    assert.deepEqual(findings, []);
  }));
