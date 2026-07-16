# secrets-guardian

Scan a git working tree — or just staged files, for a pre-commit hook — for
leaked API keys and credentials before they hit git history. Values are
**always redacted** in every output (console, reports, the allowlist file);
this tool never writes a raw secret anywhere.

## Why not just use secretlint / gitleaks?

Those are solid, more mature tools — use them if you already have them set
up. This exists as a zero-dependency-beyond-`commander`, npm-native option in
the same "Guardian" family as [`postinstall-guardian`](https://github.com/Rifat024/postinstall-guardian)
and [`vuln-guardian`](https://github.com/Rifat024/vuln-guardian): same CLI
shape (`scan` / `ci` / `approve` / `init-workflow`), same allowlist-by-hash
model, one `npx` away, no Go binary to install.

## How it works

1. **Known-format detection** for common providers — AWS, GitHub, GitLab,
   Slack, Stripe, Google, npm, Anthropic, OpenAI, Twilio, SendGrid, PEM
   private key blocks, JWTs, generic Bearer tokens.
2. **Generic entropy heuristic** — catches `SOMETHING_SECRET="..."` /
   `..._TOKEN=` / `..._PASSWORD=`-style assignments that don't match a known
   format, but only when the value looks random (Shannon entropy ≥ 3.5, no
   spaces, not an obvious placeholder like `changeme` or `your-key-here`) —
   otherwise every `.env.example` in existence would trip it.
3. **Redaction everywhere** — findings only ever carry `AKIA****MNOP`-style
   previews and a SHA-256 fingerprint, never the raw value. The allowlist
   file is safe to commit.
4. **Allowlist for reviewed false positives** — a fixture file with a fake
   key, or an already-rotated credential you're intentionally keeping in
   history, can be approved once and won't re-trigger.

## Install

```bash
npm install --save-dev secrets-guardian
```

## CLI

### `secrets-guardian scan`

```bash
secrets-guardian scan --dir . --report report.md
secrets-guardian scan --staged   # only git-staged files
```

### `secrets-guardian approve`

```bash
secrets-guardian approve
```

Adds every currently-found finding to `.secrets-guardian-allowlist.json`.
**Confirm each finding is actually safe before running this.**

### `secrets-guardian ci`

```bash
secrets-guardian ci --report secrets-guardian-report.md
```

Scans, writes a report, and exits 1 if anything unapproved is found. Run
this in CI.

### `secrets-guardian init-hook`

```bash
secrets-guardian init-hook
```

Installs a `.git/hooks/pre-commit` script that runs
`secrets-guardian ci --staged` and blocks the commit on any unapproved
finding — the earliest point a leak can be caught, before it ever touches
git history.

### `secrets-guardian init-workflow`

```bash
secrets-guardian init-workflow
# writes .github/workflows/secrets-guardian.yml
```

Runs on every push/PR to `main` (secrets can land in any commit, not on a
schedule) plus a daily backstop cron.

## Library API

```ts
import { scan } from 'secrets-guardian';

const result = await scan('./my-project', { staged: true });
if (result.unapproved.length > 0) {
  console.log(`${result.unapproved.length} unreviewed finding(s)`);
}
```

## Allowlist file format

```json
{
  "approved": ["aws-access-key-id:a1b2c3d4e5f6a7b8"]
}
```

Each entry is `ruleId:fingerprint` — a SHA-256 hash of the matched value,
never the value itself.

## Limitations

- This is a working-tree/staged-file scanner, not a full git-history scanner
  — it won't find a secret that's only in an old commit. If a real secret
  was ever committed, rotate it; removing it from the current tree doesn't
  remove it from history.
- Heuristic detection has both false positives (flag `approve` after
  review) and false negatives (a well-obfuscated or split-across-lines
  secret can slip through). Treat this as a safety net, not a guarantee.
