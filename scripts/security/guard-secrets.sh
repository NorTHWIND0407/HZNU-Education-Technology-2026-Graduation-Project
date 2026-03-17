#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

fail=0

check_and_fail() {
  local title="$1"
  local pattern="$2"
  shift 2
  local output
  output="$(git grep -nE -e "$pattern" -- "$@" || true)"
  if [[ -n "$output" ]]; then
    echo "[secret-guard] $title"
    echo "$output"
    fail=1
  fi
}

# Block accidentally committed private keys.
check_and_fail \
  "Private key material found in tracked files." \
  "-----BEGIN (OPENSSH|RSA|EC|DSA) PRIVATE KEY-----" \
  .

# Block committed API key assignments outside approved template docs.
check_and_fail \
  "VOLCENGINE API key assignment detected in tracked files." \
  "^(VITE_VOLCENGINE_API_KEY|VOLCENGINE_API_KEY)\\s*=\\s*ak-[A-Za-z0-9_-]{20,}\\s*$" \
  . \
  ':!.env.example' \
  ':!server/.env.example' \
  ':!*.md'

if [[ "$fail" -ne 0 ]]; then
  echo "[secret-guard] FAILED: remove sensitive content before push."
  exit 1
fi

echo "[secret-guard] OK"
