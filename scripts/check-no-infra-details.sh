#!/usr/bin/env bash
# Fails if a tracked file names home-infrastructure details: private IPv4
# addresses, tailnet hostnames, or NetBox token IP allow-lists. This repo is
# public; those details belong in the private Its-Akimbro/akimbo-infra repo
# (docs/agents/issue-tracker.md, ADR 0006).
#
# A line that must keep a match (e.g. a documented example) can end with the
# marker `infra-check: allow`.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

pattern='\b(10\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|192\.168\.[0-9]{1,3}\.[0-9]{1,3}|172\.(1[6-9]|2[0-9]|3[01])\.[0-9]{1,3}\.[0-9]{1,3})\b|\.ts\.net\b|allowed_ips'

matches="$(
  git grep -n -I -E "$pattern" -- \
    ':!*pnpm-lock.yaml' \
    ':!scripts/check-no-infra-details.sh' |
    grep -v 'infra-check: allow' || true
)"

if [[ -n "$matches" ]]; then
  echo "Infrastructure details found in this public repo:"
  echo "$matches"
  echo
  echo "Move them to the private Its-Akimbro/akimbo-infra repo and link to it instead."
  exit 1
fi
echo "No infrastructure details found."
