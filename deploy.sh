#!/usr/bin/env bash
set -euo pipefail

# Production deploy script for culture.lok666.com
# Usage:
#   bash deploy.sh
# Optional env:
#   REMOTE_NAME=origin
#   BRANCH_NAME=main
#   WEB_ROOT=/var/www/culture
#   PROJECT_DIR=/home/ubuntu/HZNU-Education-Technology-2026-Graduation-Project
#   BACKEND_PM2_NAME=lantern-api
#   BACKEND_SYSTEMD_SERVICE=hznu-backend

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${PROJECT_DIR:-$SCRIPT_DIR}"
BRANCH_NAME="${BRANCH_NAME:-main}"
WEB_ROOT="${WEB_ROOT:-/var/www/culture}"
BACKEND_PM2_NAME="${BACKEND_PM2_NAME:-lantern-api}"
BACKEND_SYSTEMD_SERVICE="${BACKEND_SYSTEMD_SERVICE:-hznu-backend}"

log() {
  printf '[deploy] %s\n' "$*"
}

fail() {
  printf '[deploy] ERROR: %s\n' "$*" >&2
  exit 1
}

run_privileged() {
  if [[ "${EUID}" -eq 0 ]]; then
    "$@"
    return
  fi
  if command -v sudo >/dev/null 2>&1; then
    sudo -n "$@"
    return
  fi
  fail "Need root or passwordless sudo to run: $*"
}

detect_remote() {
  if [[ -n "${REMOTE_NAME:-}" ]]; then
    printf '%s' "$REMOTE_NAME"
    return
  fi
  if git remote get-url origin >/dev/null 2>&1; then
    printf 'origin'
    return
  fi
  if git remote get-url Main >/dev/null 2>&1; then
    printf 'Main'
    return
  fi
  fail "No git remote found. Configure origin or export REMOTE_NAME."
}

restart_backend() {
  if command -v pm2 >/dev/null 2>&1 && pm2 describe "$BACKEND_PM2_NAME" >/dev/null 2>&1; then
    log "Restart backend via pm2: $BACKEND_PM2_NAME"
    pm2 restart "$BACKEND_PM2_NAME" --update-env
    return
  fi
  if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files | grep -q "^${BACKEND_SYSTEMD_SERVICE}\.service"; then
    log "Restart backend via systemd: $BACKEND_SYSTEMD_SERVICE"
    run_privileged systemctl restart "$BACKEND_SYSTEMD_SERVICE"
    return
  fi
  log "Backend restart skipped (no pm2 app '$BACKEND_PM2_NAME' or systemd service '$BACKEND_SYSTEMD_SERVICE')."
}

health_check() {
  local api_ok=0
  local asset_path

  if curl -fsS http://127.0.0.1:3001/ >/dev/null 2>&1; then
    api_ok=1
  fi

  asset_path="$(grep -oE '/assets/index-[^"]+\.js' "$WEB_ROOT/index.html" | head -n 1 || true)"
  if [[ -z "$asset_path" ]]; then
    fail "Cannot find built index asset in $WEB_ROOT/index.html"
  fi
  if [[ ! -f "$WEB_ROOT/${asset_path#/}" ]]; then
    fail "Built asset missing: $WEB_ROOT/${asset_path#/}"
  fi
  if [[ ! -f "$WEB_ROOT/content/lessons.json" ]]; then
    fail "Missing deployed content file: $WEB_ROOT/content/lessons.json"
  fi

  if [[ "$api_ok" -eq 1 ]]; then
    log "Health check passed (frontend + backend)."
  else
    log "Health check passed for frontend; backend http://127.0.0.1:3001/ not reachable."
  fi
}

main() {
  cd "$PROJECT_DIR"
  local remote
  remote="$(detect_remote)"

  log "Project dir: $PROJECT_DIR"
  log "Using remote: $remote/$BRANCH_NAME"

  log "Sync code and LFS..."
  git fetch "$remote" --prune
  git checkout "$BRANCH_NAME"
  git reset --hard "$remote/$BRANCH_NAME"
  git lfs install --local
  git lfs pull "$remote" "$BRANCH_NAME"

  if [[ ! -w "$PROJECT_DIR" ]]; then
    fail "No write permission on project dir: $PROJECT_DIR"
  fi

  log "Install and build frontend..."
  npm ci
  npm run build

  log "Deploy static assets to $WEB_ROOT..."
  run_privileged mkdir -p "$WEB_ROOT"
  run_privileged rsync -av --delete "$PROJECT_DIR/dist/" "$WEB_ROOT/"
  run_privileged mkdir -p "$WEB_ROOT/content"
  run_privileged rsync -av --delete "$PROJECT_DIR/content/" "$WEB_ROOT/content/"

  restart_backend

  log "Reload nginx..."
  run_privileged nginx -t
  run_privileged systemctl reload nginx

  health_check

  log "Deploy done. HEAD: $(git rev-parse --short HEAD)"
}

main "$@"
