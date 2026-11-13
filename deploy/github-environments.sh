#!/usr/bin/env bash
# Puts every production deploy behind an approval. Run it once, signed in to
# the GitHub CLI as the repository's owner. Azure Cloud Shell has `gh`:
#
#   bash northwind-commerce/deploy/github-environments.sh
#
# Afterwards each production region waits for your approval once a release has
# baked in staging. Approve or reject it in CodeLens (the run page shows the
# gate) or on GitHub. To remove the gates again:
#
#   REVIEWERS=none bash northwind-commerce/deploy/github-environments.sh
set -euo pipefail

say() { printf '\n==> %s\n' "$*"; }
die() { printf '\nerror: %s\n' "$*" >&2; exit 1; }

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="${REPO:-$(git -C "$HERE" remote get-url origin 2>/dev/null | sed -E 's#^(git@github\.com:|https://github\.com/)##; s#\.git$##')}"
[[ "$REPO" =~ ^[^/]+/[^/]+$ ]] || die "Could not tell which GitHub repository this is. Run with REPO=owner/name."
command -v gh >/dev/null || die "Install the GitHub CLI, or run this in Azure Cloud Shell."
gh auth status >/dev/null 2>&1 || die "Sign in first: gh auth login"

me_login="$(gh api user --jq .login)"
me_id="$(gh api user --jq .id)"

if [[ "${REVIEWERS:-me}" == none ]]; then
  say "Removing the approval from $REPO's production environments"
  body='{"reviewers":[]}'
else
  say "Requiring @$me_login's approval for $REPO's production deploys"
  # Self-review stays allowed: the person who pushed is usually the one approving.
  body="$(printf '{"reviewers":[{"type":"User","id":%s}],"prevent_self_review":false}' "$me_id")"
fi

for environment in production-us production-ca production-eu; do
  gh api --method PUT "repos/$REPO/environments/$environment" --input - <<<"$body" >/dev/null
  echo "  $environment updated"
done

say "Done"
if [[ "${REVIEWERS:-me}" != none ]]; then
  echo "The next release bakes in staging, then waits for your approval before each production region."
fi
