#!/usr/bin/env bash
set -euo pipefail

echo "This script will rewrite git history to remove secrets using git-filter-repo."
echo "Please ensure you HAVE backed up the repository and coordinate with collaborators."

if [ -z "${GIT_DIR:-}" ]; then
    echo "Ensure you're running this in the working repo (not within a submodule)."
fi

if ! command -v git-filter-repo >/dev/null 2>&1; then
    echo "git-filter-repo not found. Install it with: pip install git-filter-repo"
    exit 1
fi

if [ -z "$(git config --get remote.origin.url)" ]; then
    echo "No origin remote found. Set origin and re-run."
    exit 1
fi

REPO_URL=$(git config --get remote.origin.url)
BACKUP_BRANCH=backup-with-secrets-$(date +%Y%m%d%H%M%S)

# Make a backup branch locally
git checkout -b "${BACKUP_BRANCH}" || git branch "${BACKUP_BRANCH}"
git push origin "${BACKUP_BRANCH}"

mkdir -p /tmp/secret-cleanup
cd /tmp/secret-cleanup

echo "Cloning mirror of ${REPO_URL}..."
git clone --mirror "${REPO_URL}" repo-mirror.git
cd repo-mirror.git

echo "Running git-filter-repo with replacements.txt in the original working directory..."
git filter-repo --replace-text "${OLDPWD}/replacements.txt"

echo "Force-pushing all branches and tags..."
git push --force --all
git push --force --tags

echo "History rewrite complete. Remember to rotate exposed keys, and ask all collaborators to re-clone the repository."
