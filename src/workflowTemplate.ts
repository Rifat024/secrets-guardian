export interface WorkflowOptions {
  cron?: string;
  nodeVersion?: string;
}

/**
 * Secrets can land in any commit, so this runs on every push/PR (not just
 * daily) plus a full-history-free daily backstop scan of the working tree,
 * matching postinstall-guardian's push+cron pattern.
 */
export function workflowYaml(options: WorkflowOptions = {}): string {
  const cron = options.cron ?? '0 6 * * *';
  const nodeVersion = options.nodeVersion ?? '20';

  return `name: secrets-guardian

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '${cron}'
  workflow_dispatch: {}

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '${nodeVersion}'

      - name: Scan for leaked secrets
        run: npx secrets-guardian ci
`;
}
