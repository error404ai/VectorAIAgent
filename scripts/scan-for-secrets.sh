#!/usr/bin/env bash
set -euo pipefail

echo "Scanning for potential OpenAI API keys and other 'sk-' patterns..."
git ls-files --exclude-standard -z | xargs -0 grep -nE "sk-[A-Za-z0-9_\-]{10,}" || true
echo "Done. If matches were found above, update those files to remove secrets before committing."
