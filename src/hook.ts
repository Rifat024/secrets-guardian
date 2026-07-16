export const PRE_COMMIT_HOOK = `#!/bin/sh
# Installed by secrets-guardian init-hook. Blocks a commit if staged files
# contain an unapproved secret.
npx --yes secrets-guardian ci --staged
`;
