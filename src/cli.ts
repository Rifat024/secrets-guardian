#!/usr/bin/env node
import { Command } from 'commander';
import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { scan } from './scan';
import { scanToMarkdown } from './report';
import { readBaseline, writeBaseline, mergeIntoBaseline, DEFAULT_BASELINE_FILE } from './baseline';
import { workflowYaml } from './workflowTemplate';
import { PRE_COMMIT_HOOK } from './hook';

const program = new Command();

program
  .name('secrets-guardian')
  .description('Scan a git working tree (or staged files) for leaked API keys and credentials.')
  .version('0.1.0');

function writeReport(path: string | undefined, contents: string) {
  if (!path) return;
  const full = resolve(process.cwd(), path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, contents, 'utf8');
}

program
  .command('scan')
  .description('Scan the working tree (or --staged files) and flag anything not in the allowlist.')
  .option('-d, --dir <path>', 'project directory', '.')
  .option('-s, --staged', 'scan only git-staged files', false)
  .option('-r, --report <path>', 'write a Markdown report to this path')
  .action(async (opts) => {
    const cwd = resolve(process.cwd(), opts.dir);
    const result = await scan(cwd, { staged: opts.staged });
    const md = scanToMarkdown(result);
    console.log(md);
    writeReport(opts.report, md);
  });

program
  .command('approve')
  .description('Add all currently-found findings to the allowlist (confirm each is safe first!).')
  .option('-d, --dir <path>', 'project directory', '.')
  .option('-s, --staged', 'scan only git-staged files', false)
  .action(async (opts) => {
    const cwd = resolve(process.cwd(), opts.dir);
    const result = await scan(cwd, { staged: opts.staged });
    const baseline = await readBaseline(cwd);
    const updated = mergeIntoBaseline(baseline, result.findings);
    await writeBaseline(cwd, updated);
    console.log(`Approved ${result.unapproved.length} new finding(s). ${DEFAULT_BASELINE_FILE} now tracks ${updated.approved.length} entr(y/ies).`);
  });

program
  .command('ci')
  .description('Scan and exit non-zero if any unapproved secret is found.')
  .option('-d, --dir <path>', 'project directory', '.')
  .option('-s, --staged', 'scan only git-staged files (used by the pre-commit hook)', false)
  .option('-r, --report <path>', 'write a Markdown report to this path', 'secrets-guardian-report.md')
  .action(async (opts) => {
    const cwd = resolve(process.cwd(), opts.dir);
    const result = await scan(cwd, { staged: opts.staged });
    const md = scanToMarkdown(result);
    console.log(md);
    if (!opts.staged) writeReport(opts.report, md);

    if (result.unapproved.length > 0) {
      process.exitCode = 1;
    }
  });

program
  .command('init-hook')
  .description('Install a git pre-commit hook that blocks commits containing unapproved secrets.')
  .option('-d, --dir <path>', 'project directory', '.')
  .action((opts) => {
    const cwd = resolve(process.cwd(), opts.dir);
    const gitDir = join(cwd, '.git');
    if (!existsSync(gitDir)) {
      console.error(`No .git directory found at ${cwd}. Run this from a git repository root.`);
      process.exitCode = 1;
      return;
    }
    const hookPath = join(gitDir, 'hooks', 'pre-commit');
    writeFileSync(hookPath, PRE_COMMIT_HOOK, 'utf8');
    chmodSync(hookPath, 0o755);
    console.log(`Installed pre-commit hook at ${hookPath}`);
  });

program
  .command('init-workflow')
  .description('Write a GitHub Actions workflow that runs secrets-guardian on every push/PR (plus a daily backstop).')
  .option('-o, --out <path>', 'workflow file path', '.github/workflows/secrets-guardian.yml')
  .option('--cron <expr>', 'backstop cron schedule (UTC)', '0 6 * * *')
  .option('--node-version <version>', 'Node.js version to run under', '20')
  .action((opts) => {
    const yaml = workflowYaml({ cron: opts.cron, nodeVersion: opts.nodeVersion });
    const full = resolve(process.cwd(), opts.out);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, yaml, 'utf8');
    console.log(`Wrote ${opts.out}`);
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
