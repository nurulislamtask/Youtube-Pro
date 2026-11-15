#!/usr/bin/env bash
# One-command publish: creates the GitHub repo, adds license, topics, pushes, and triggers builds.
# Requirements: git and GitHub CLI (https://cli.github.com), then run `gh auth login` once.
set -euo pipefail

REPO="${1:-youtube-pro}"
VERSION="${2:-v0.1.0}"

gh auth status >/dev/null || { echo "Run 'gh auth login' first."; exit 1; }

# GPL-3.0 license text from GitHub (keeps compatibility with LibreTube/Flow/NouTube credits)
[ -f LICENSE ] || gh api licenses/gpl-3.0 --jq .body > LICENSE

git init -b main
git add .
git commit -m "Initial commit: YouTube Pro"

gh repo create "$REPO" --public --source=. --remote=origin --push \
  --description "Free, ad-free YouTube client for Windows, Linux, macOS, Android and iOS. Themes, synced lyrics, SponsorBlock. No premium."

gh repo edit --add-topic youtube --add-topic tauri --add-topic react --add-topic music-player \
  --add-topic android --add-topic windows --add-topic linux --add-topic macos --add-topic ios \
  --add-topic sponsorblock --add-topic open-source

git tag "$VERSION"
git push origin "$VERSION"

echo "Done. Builds running: $(gh repo view --json url --jq .url)/actions"
echo "Installers will appear under Releases when the workflow finishes."
