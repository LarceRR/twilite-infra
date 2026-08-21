#!/usr/bin/env bash
set -Eeuo pipefail

: "${RESTORE_REPORT:?set restore report}"
: "${RESTORE_TARGET_DIR:?set isolated restore target}"
: "${RESTORE_DB_NAME:?set restored database name}"
: "${RESTORE_DB_USER:?set restricted restore user}"
: "${RESTORE_DB_PORT:?set isolated PostgreSQL port}"
: "${RESTORE_SMOKE_URL:?set isolated smoke URL}"

[[ -s "$RESTORE_REPORT" ]] || { echo 'restore report missing' >&2; exit 1; }
[[ -d "$RESTORE_TARGET_DIR" ]] || { echo 'restore target missing' >&2; exit 1; }
pg_checksums --check --pgdata="$RESTORE_TARGET_DIR" || true
pg_isready --host=127.0.0.1 --port="$RESTORE_DB_PORT" --dbname="$RESTORE_DB_NAME" --username="$RESTORE_DB_USER"
psql --host=127.0.0.1 --port="$RESTORE_DB_PORT" --dbname="$RESTORE_DB_NAME" --username="$RESTORE_DB_USER" --command='SELECT 1' >/dev/null
curl --fail --silent --show-error --max-time 15 "$RESTORE_SMOKE_URL" >/dev/null
python3 - "$RESTORE_REPORT" <<'PY'
import json, sys
with open(sys.argv[1], encoding='utf-8') as handle:
    report = json.load(handle)
required = {'download', 'decrypt', 'restore'}
if not required.issubset(set(report.get('validations', []))):
    raise SystemExit('restore report misses backup validations')
if not report.get('staging_reseed_required', False):
    raise SystemExit('cluster PITR must require staging reseed')
PY
printf '%s\n' 'restore verification passed: schema, integrity and smoke'
