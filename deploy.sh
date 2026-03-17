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
#   BACKEND_PORT=3001
#   BACKEND_ENTRY=/home/ubuntu/HZNU-Education-Technology-2026-Graduation-Project/server/index.js
#   BACKEND_LOG_FILE=/tmp/culture-server.log
#   FRONTEND_API_URL=https://culture.lok666.com/api
#   FRONTEND_ENABLE_MOCK=false

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${PROJECT_DIR:-$SCRIPT_DIR}"
BRANCH_NAME="${BRANCH_NAME:-main}"
WEB_ROOT="${WEB_ROOT:-/var/www/culture}"
BACKEND_PM2_NAME="${BACKEND_PM2_NAME:-lantern-api}"
BACKEND_SYSTEMD_SERVICE="${BACKEND_SYSTEMD_SERVICE:-hznu-backend}"
BACKEND_PORT="${BACKEND_PORT:-3001}"
BACKEND_ENTRY="${BACKEND_ENTRY:-$PROJECT_DIR/server/index.js}"
BACKEND_LOG_FILE="${BACKEND_LOG_FILE:-/tmp/culture-server.log}"
FRONTEND_API_URL="${FRONTEND_API_URL:-}"
FRONTEND_ENABLE_MOCK="${FRONTEND_ENABLE_MOCK:-false}"

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

upsert_env_var() {
  local env_file="$1"
  local key="$2"
  local value="$3"
  local tmp_file
  tmp_file="$(mktemp)"

  if [[ -f "$env_file" ]]; then
    grep -v "^${key}=" "$env_file" > "$tmp_file" || true
  fi
  printf '%s=%s\n' "$key" "$value" >> "$tmp_file"
  mv "$tmp_file" "$env_file"
}

sync_backend_ai_env() {
  local env_file="$PROJECT_DIR/server/.env"
  local updated=0

  if [[ ! -f "$env_file" ]]; then
    cp "$PROJECT_DIR/server/.env.example" "$env_file"
  fi

  if [[ -n "${VOLCENGINE_API_KEY:-}" ]]; then
    upsert_env_var "$env_file" "VOLCENGINE_API_KEY" "$VOLCENGINE_API_KEY"
    updated=1
  fi
  if [[ -n "${VOLCENGINE_ENDPOINT_ID:-}" ]]; then
    upsert_env_var "$env_file" "VOLCENGINE_ENDPOINT_ID" "$VOLCENGINE_ENDPOINT_ID"
    updated=1
  fi
  if [[ -n "${VOLCENGINE_MODEL:-}" ]]; then
    upsert_env_var "$env_file" "VOLCENGINE_MODEL" "$VOLCENGINE_MODEL"
    updated=1
  fi

  if [[ "$updated" -eq 1 ]]; then
    log "Synced backend AI env into server/.env from deploy runtime variables."
  else
    log "No deploy-time AI env provided; keep existing server/.env values."
  fi
}

sync_frontend_build_env() {
  local env_file="$PROJECT_DIR/.env.production"

  if [[ ! -f "$env_file" ]]; then
    touch "$env_file"
  fi

  if [[ -n "$FRONTEND_API_URL" ]]; then
    upsert_env_var "$env_file" "VITE_API_URL" "$FRONTEND_API_URL"
  elif ! grep -q '^VITE_API_URL=' "$env_file"; then
    upsert_env_var "$env_file" "VITE_API_URL" "https://culture.lok666.com/api"
  fi

  upsert_env_var "$env_file" "VITE_ENABLE_MOCK" "$FRONTEND_ENABLE_MOCK"

  if ! grep -q '^VITE_I18N_DEFAULT=' "$env_file"; then
    upsert_env_var "$env_file" "VITE_I18N_DEFAULT" "zh"
  fi
  if ! grep -q '^VITE_USE_AR=' "$env_file"; then
    upsert_env_var "$env_file" "VITE_USE_AR" "true"
  fi

  log "Synced frontend production env (.env.production)."
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
  log "No pm2/systemd backend manager detected. Use nohup fallback."

  local old_pids
  old_pids="$(lsof -tiTCP:${BACKEND_PORT} -sTCP:LISTEN || true)"
  if [[ -n "$old_pids" ]]; then
    log "Stopping existing backend listener on :$BACKEND_PORT ($old_pids)"
    kill $old_pids >/dev/null 2>&1 || run_privileged kill $old_pids || true
    sleep 1
  fi

  log "Starting backend via nohup: node $BACKEND_ENTRY"
  nohup node "$BACKEND_ENTRY" > "$BACKEND_LOG_FILE" 2>&1 &
  sleep 1

  if curl -fsS "http://127.0.0.1:${BACKEND_PORT}/" >/dev/null 2>&1; then
    log "Backend started via nohup (log: $BACKEND_LOG_FILE)."
  else
    fail "Backend failed to start via nohup. Check log: $BACKEND_LOG_FILE"
  fi
}

health_check() {
  local api_ok=0
  local ai_route_ok=0
  local ai_status=000
  local asset_path

  if curl -fsS "http://127.0.0.1:${BACKEND_PORT}/" >/dev/null 2>&1; then
    api_ok=1
  fi

  ai_status="$(curl -sS -o /tmp/deploy_ai_route_check.json -w '%{http_code}' \
    -X POST "http://127.0.0.1:${BACKEND_PORT}/api/ai/chat" \
    -H 'Content-Type: application/json' \
    -d '{"question":"health-check"}' || true)"
  if [[ "$ai_status" != "404" && "$ai_status" != "000" ]]; then
    ai_route_ok=1
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

  if [[ "$api_ok" -eq 1 && "$ai_route_ok" -eq 1 ]]; then
    log "Health check passed (frontend + backend + ai-route)."
  elif [[ "$api_ok" -eq 1 ]]; then
    log "Health check passed (frontend + backend); ai-route status: $ai_status."
  else
    log "Health check passed for frontend; backend http://127.0.0.1:${BACKEND_PORT}/ not reachable."
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

  log "Install backend dependencies..."
  npm ci --prefix server

  sync_frontend_build_env

  log "Install and build frontend..."
  npm ci
  npm run build

  log "Deploy static assets to $WEB_ROOT..."
  run_privileged mkdir -p "$WEB_ROOT"
  run_privileged rsync -av --delete "$PROJECT_DIR/dist/" "$WEB_ROOT/"
  run_privileged mkdir -p "$WEB_ROOT/content"
  run_privileged rsync -av --delete "$PROJECT_DIR/content/" "$WEB_ROOT/content/"

  sync_backend_ai_env

  restart_backend

  log "Reload nginx..."
  run_privileged nginx -t
  run_privileged systemctl reload nginx

  health_check

  log "Deploy done. HEAD: $(git rev-parse --short HEAD)"
}

main "$@"
