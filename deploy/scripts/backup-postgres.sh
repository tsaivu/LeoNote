#!/bin/sh
set -eu

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUTPUT_FILE="${BACKUP_DIR}/personal_notes_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"
export PGPASSWORD="${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"

pg_dump \
  --host="${POSTGRES_HOST:-postgres}" \
  --port="${POSTGRES_PORT:-5432}" \
  --username="${POSTGRES_USER:?POSTGRES_USER is required}" \
  --dbname="${POSTGRES_DB:?POSTGRES_DB is required}" \
  --format=plain \
  --no-owner \
  --no-privileges \
  | gzip > "${OUTPUT_FILE}"

find "${BACKUP_DIR}" -name "personal_notes_*.sql.gz" -type f -mtime +"${RETENTION_DAYS}" -delete

echo "Backup written: ${OUTPUT_FILE}"
