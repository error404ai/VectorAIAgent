## Removing Leaked Secrets and Cleaning Git History

This repository had OpenAI API keys committed to history. The next steps will remove hardcoded keys from the working tree and provide a script to clean your Git history and push a cleaned repo.

Important: Rewriting history is destructive. Coordinate with collaborators, back up the repo, and ensure you rotate/revoke API keys immediately.

1) Revoke and rotate the compromised API key(s)
   - Go to your OpenAI dashboard, locate the leaked API key(s), and revoke them.
   - Create a new key if needed and store it in secret manager or environment variables. Do NOT commit keys into the repo.

2) Confirm local working tree is clean
   - We've patched the code to remove hardcoded keys and add `.env.example`. Commit any pending changes:
     ```bash
     git add -A
     git commit -m "chore: remove hardcoded API keys; use env var"
     ```

3) Remove secrets from earlier commits (rewrite history) - optional but highly recommended
   - This script uses `git-filter-repo` to replace secret patterns with `[REDACTED]` in history. Before running it:
     - Backup: `git checkout -b backup-with-secrets` and push: `git push origin backup-with-secrets`
     - Install `git-filter-repo` if not present: `pip install git-filter-repo`
   - Then run the included script (from the repository root):
     ```bash
     bash ./scripts/remove-secrets.sh
     ```

4) After pushing rewritten history
   - Inform collaborators that they must re-clone the repository (or reset their local base) because commit hashes changed.
   - Revoke the old API key(s) as indicated above.

5) Add safeguards to prevent future leaks
   - Add a secret scanning pre-commit hook, or use GitHub pre-receive hooks and secret scanning.
   - Keep `.env` in `.gitignore` and use `.env.example` for local setup instructions.
