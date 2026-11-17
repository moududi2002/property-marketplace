#!/usr/bin/env bash
# 📍 /infrastructure/scripts/deploy.sh
#
# Run from the project root after `git pull`:
#   bash infrastructure/scripts/deploy.sh
#
# Steps:
#   1. Install deps
#   2. Run DB migrations
#   3. Build web + api
#   4. Reload PM2 (zero-downtime)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${BLUE}▶ $*${NC}"; }
ok()  { echo -e "${GREEN}✓ $*${NC}"; }
err() { echo -e "${RED}✗ $*${NC}" >&2; }

trap 'err "Deploy failed at line $LINENO"; exit 1' ERR

# ─── Pre-flight ─────────────────────────────────────────────
if [ ! -f .env ]; then
  err ".env not found in project root"
  exit 1
fi

log "Deploy started — $(date)"

# ─── 1. Pull latest code (if running via git) ───────────────
if [ -d .git ]; then
  log "Pulling latest code from git…"
  git pull --ff-only
fi

# ─── 2. Install dependencies ────────────────────────────────
log "Installing dependencies…"
pnpm install --frozen-lockfile
ok "Dependencies installed"

# ─── 3. Generate Prisma client ──────────────────────────────
log "Generating Prisma client…"
pnpm --filter @property-marketplace/api prisma:generate
ok "Prisma client generated"

# ─── 4. Run production migrations ───────────────────────────
log "Running database migrations…"
pnpm --filter @property-marketplace/api prisma:migrate:prod
ok "Migrations applied"

# ─── 5. Seed (idempotent, safe to run always) ───────────────
log "Running seed (idempotent)…"
pnpm --filter @property-marketplace/api prisma:seed || true
ok "Seed complete"

# ─── 6. Build apps ──────────────────────────────────────────
log "Building API…"
pnpm --filter @property-marketplace/api build
ok "API built"

log "Building Web…"
pnpm --filter @property-marketplace/web build
ok "Web built"

# ─── 7. Reload PM2 (zero-downtime for cluster mode) ─────────
log "Reloading PM2 processes…"
if pm2 describe property-api > /dev/null 2>&1; then
  pm2 reload infrastructure/pm2/ecosystem.config.cjs --update-env
else
  pm2 start infrastructure/pm2/ecosystem.config.cjs
fi
pm2 save
ok "PM2 reloaded"

# ─── 8. Reload Nginx ────────────────────────────────────────
log "Reloading Nginx…"
sudo nginx -t && sudo systemctl reload nginx
ok "Nginx reloaded"

# ─── 9. Health check ────────────────────────────────────────
log "Waiting for API health…"
for i in {1..30}; do
  if curl -sf http://localhost:4000/health > /dev/null; then
    ok "API is healthy"
    break
  fi
  if [ "$i" -eq 30 ]; then
    err "API health check failed after 30s"
    pm2 logs property-api --lines 50 --nostream
    exit 1
  fi
  sleep 1
done

echo ""
ok "🚀 Deployment complete — $(date)"
echo ""
pm2 status