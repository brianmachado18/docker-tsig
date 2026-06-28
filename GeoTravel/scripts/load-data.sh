#!/usr/bin/env bash
set -euo pipefail

DB_HOST="${POSTGRES_HOST:-postgres}"
DB_NAME="${POSTGRES_DB:-tsig}"
DB_USER="${POSTGRES_USER:-tsig}"
SEED_NAME="${SEED_NAME:-data.sql}"
SEED_FILE="${SEED_FILE:-/data/data.sql}"

required_tables="
atraccion
zona
recorrido
recorrido_zona
recorrido_atracciones
"

echo "Waiting for JPA schema in database ${DB_NAME}..."
for attempt in $(seq 1 60); do
  missing=0
  for table in $required_tables; do
    exists="$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT to_regclass('public.${table}') IS NOT NULL")"
    if [ "$exists" != "t" ]; then
      missing=1
      break
    fi
  done

  if [ "$missing" -eq 0 ]; then
    echo "JPA schema detected."
    break
  fi

  if [ "$attempt" -eq 60 ]; then
    echo "Timed out waiting for JPA schema." >&2
    exit 1
  fi

  sleep 5
done

psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" <<SQL
CREATE TABLE IF NOT EXISTS app_seed_history (
  seed_name text PRIMARY KEY,
  loaded_at timestamp NOT NULL DEFAULT now()
);
SQL

already_loaded="$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT 1 FROM app_seed_history WHERE seed_name = '${SEED_NAME}'")"
if [ "$already_loaded" = "1" ]; then
  echo "Seed ${SEED_NAME} already loaded. Skipping."
  exit 0
fi

echo "Loading ${SEED_FILE}..."
psql -v ON_ERROR_STOP=1 -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$SEED_FILE"

psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "INSERT INTO app_seed_history(seed_name) VALUES ('${SEED_NAME}')"
echo "Seed ${SEED_NAME} loaded."
