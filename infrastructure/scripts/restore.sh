#!/usr/bin/env bash
# 📍 /infrastructure/scripts/restore.sh
#
# Restore a PostgreSQL backup. USE WITH EXTREME CAUTION.
#
# Usage:
#   bash infrastructure/scripts/restore.sh /var/backups/.../db-20261117-020000.sql.gz

set -euo pipefail

FILE="${1:-}"
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  echo "Usage: $0 <path-to-backup.sql.gz>" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
set -a
# shellcheck disable=SC1091
. "$ROOT/.env"
set +a

read -p "⚠️  This will OVERWRITE the current database. Type 'yes' to continue: " CONFIRM
[ "$CONFIRM" = "yes" ] || { echo "Aborted."; exit 1; }

echo "▶ Stopping API…"
pm2 stop property-api || true

echo "▶ Restoring $FILE …"
gunzip -c "$FILE" | PGPASSWORD="$POSTGRES_PASSWORD" psql \
  -h localhost -U "$POSTGRES_USER" -d "$POSTGRES_DB"

echo "▶ Starting API…"
pm2 start property-api

echo "✅ Restore complete. Verify health:"
curl -sf http://localhost:4000/health | jq