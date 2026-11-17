#!/usr/bin/env bash
# 📍 /infrastructure/scripts/backup.sh
#
# Daily backup: PostgreSQL dump + uploaded files (if local S3/MinIO).
# Retention: 14 daily + 8 weekly + 6 monthly.
#
# Runs via systemd timer — see infrastructure/systemd/.

set -euo pipefail

BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/property-marketplace}"
TIMESTAMP=$(date -u +"%Y%m%d-%H%M%S")
DAY_OF_WEEK=$(date -u +"%u")
DAY_OF_MONTH=$(date -u +"%d")
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

mkdir -p "$BACKUP_ROOT"/{daily,weekly,monthly}

# ─── Load env ──────────────────────────────────────────────
set -a
# shellcheck disable=SC1091
. "$ROOT/.env"
set +a

# ─── 1. PostgreSQL dump ────────────────────────────────────
echo "▶ Dumping PostgreSQL…"
DB_FILE="$BACKUP_ROOT/daily/db-$TIMESTAMP.sql.gz"
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
  -h localhost \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  --no-owner --no-privileges --clean --if-exists \
  | gzip > "$DB_FILE"
echo "  ✓ $DB_FILE ($(du -h "$DB_FILE" | cut -f1))"

# ─── 2. Uploads (only if using local MinIO) ────────────────
if [ -d /var/lib/docker/volumes/pm-minio-data ]; then
  echo "▶ Archiving MinIO data…"
  UP_FILE="$BACKUP_ROOT/daily/uploads-$TIMESTAMP.tar.gz"
  sudo tar -czf "$UP_FILE" -C /var/lib/docker/volumes/pm-minio-data/_data .
  echo "  ✓ $UP_FILE ($(du -h "$UP_FILE" | cut -f1))"
fi

# ─── 3. .env snapshot (encrypted) ──────────────────────────
echo "▶ Backing up .env (encrypted)…"
ENV_FILE="$BACKUP_ROOT/daily/env-$TIMESTAMP.gpg"
if command -v gpg > /dev/null; then
  gpg --batch --yes --symmetric --cipher-algo AES256 \
    --passphrase-file /etc/property-backup-pass \
    -o "$ENV_FILE" "$ROOT/.env"
  echo "  ✓ $ENV_FILE"
else
  echo "  ! gpg not installed — skipping .env backup"
fi

# ─── 4. Rotate ─────────────────────────────────────────────
if [ "$DAY_OF_WEEK" = "7" ]; then
  cp "$DB_FILE" "$BACKUP_ROOT/weekly/"
  [ -f "${UP_FILE:-/nonexistent}" ] && cp "$UP_FILE" "$BACKUP_ROOT/weekly/"
fi
if [ "$DAY_OF_MONTH" = "01" ]; then
  cp "$DB_FILE" "$BACKUP_ROOT/monthly/"
fi

# Retention
find "$BACKUP_ROOT/daily"   -type f -mtime +14 -delete
find "$BACKUP_ROOT/weekly"  -type f -mtime +60 -delete
find "$BACKUP_ROOT/monthly" -type f -mtime +180 -delete

echo ""
echo "✅ Backup complete at $(date)"
du -sh "$BACKUP_ROOT"