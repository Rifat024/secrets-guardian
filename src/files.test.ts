import assert from 'node:assert';
import { test } from 'node:test';
import { listStagedFiles, listWorkingTreeFiles } from './files';
import type { GitRunner } from './files';

function fakeGit(responses: Record<string, string>): GitRunner {
  return async (args) => {
    const key = args.join(' ');
    if (key in responses) return responses[key];
    throw new Error(`unexpected git invocation: ${key}`);
  };
}

test('listWorkingTreeFiles merges tracked and untracked-not-ignored files, deduped', async () => {
  const git = fakeGit({
    'ls-files': 'a.js\nb.js\n',
    'ls-files --others --exclude-standard': 'b.js\nc.js\n',
  });

  const files = await listWorkingTreeFiles('/repo', git);
  assert.deepEqual([...files].sort(), ['a.js', 'b.js', 'c.js']);
});

test('listStagedFiles returns staged, added/copied/modified files', async () => {
  const git = fakeGit({
    'diff --cached --name-only --diff-filter=ACM': 'staged1.ts\nstaged2.ts\n',
  });

  const files = await listStagedFiles('/repo', git);
  assert.deepEqual(files, ['staged1.ts', 'staged2.ts']);
});

test('returns an empty list when git commands fail (e.g. not a git repo)', async () => {
  const git: GitRunner = async () => {
    throw new Error('not a git repository');
  };
  assert.deepEqual(await listWorkingTreeFiles('/repo', git), []);
  assert.deepEqual(await listStagedFiles('/repo', git), []);
});
