import assert from 'node:assert';
import { test } from 'node:test';
import { shannonEntropy, looksLikePlaceholder, looksLikeSecret } from './entropy';

test('shannonEntropy is low for repeated characters, high for random-looking strings', () => {
  assert.ok(shannonEntropy('aaaaaaaa') < 1);
  assert.ok(shannonEntropy('kX9pL2mQ7zR4vN8w') > 3.5);
});

test('looksLikePlaceholder recognizes common non-secret filler values', () => {
  assert.equal(looksLikePlaceholder('your-api-key-here'), true);
  assert.equal(looksLikePlaceholder('changeme'), true);
  assert.equal(looksLikePlaceholder('xxxxxxxx'), true);
  assert.equal(looksLikePlaceholder('<YOUR_SECRET>'), true);
  assert.equal(looksLikePlaceholder('${SECRET_TOKEN}'), true);
  assert.equal(looksLikePlaceholder('kX9pL2mQ7zR4vN8w'), false);
});

test('looksLikeSecret rejects placeholders and low-entropy values, accepts random-looking ones', () => {
  assert.equal(looksLikeSecret('changeme'), false);
  assert.equal(looksLikeSecret('password'), false);
  assert.equal(looksLikeSecret('has spaces in it'), false);
  assert.equal(looksLikeSecret('7k2ZpQ9mXvL4nR8wYt3B'), true);
});
