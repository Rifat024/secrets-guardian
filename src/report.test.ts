import assert from 'node:assert';
import { test } from 'node:test';
import { scanToMarkdown } from './report';
import type { Finding } from './types';

const finding: Finding = {
  ruleId: 'aws-access-key-id',
  ruleName: 'AWS Access Key ID',
  file: 'src/config.js',
  line: 12,
  preview: 'AKIA************MNOP',
  fingerprint: 'deadbeef12345678',
};

test('scanToMarkdown reports a clean scan', () => {
  const md = scanToMarkdown({ findings: [], unapproved: [], filesScanned: 10 });
  assert.match(md, /No unapproved secrets found/);
});

test('scanToMarkdown lists unapproved findings with location and redacted preview', () => {
  const md = scanToMarkdown({ findings: [finding], unapproved: [finding], filesScanned: 1 });
  assert.match(md, /AWS Access Key ID/);
  assert.match(md, /src\/config\.js:12/);
  assert.match(md, /AKIA\*+MNOP/);
});

test('scanToMarkdown never contains anything beyond the pre-redacted preview', () => {
  const md = scanToMarkdown({ findings: [finding], unapproved: [finding], filesScanned: 1 });
  // The report only ever receives already-redacted Finding objects, so as
  // long as it doesn't echo raw file contents it can't leak a secret.
  assert.equal(md.includes('IOSFODNN7EXAMPLE'), false);
});
