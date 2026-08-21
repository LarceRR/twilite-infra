#!/usr/bin/env bash
set -Eeuo pipefail

: "${PGBACKREST_CONFIG:?set pgBackRest config path}"
: "${PGBACKREST_STANZA:?set stanza}"
: "${PGBACKREST_REPO_CIPHER_PASS_FILE:?set root-only cipher material path}"
: "${PGBACKREST_S3_ENDPOINT:?set external S3 endpoint}"
: "${PGBACKREST_S3_BUCKET:?set external backup bucket}"
: "${PGBACKREST_S3_REGION:?set S3 region}"
: "${BACKUP_REPORT_DIR:?set report directory}"

install -d -m 700 "$BACKUP_REPORT_DIR"
start_ns="$(date +%s%N)"
export PGBACKREST_REPO1_CIPHER_PASS_FILE="$PGBACKREST_REPO_CIPHER_PASS_FILE"
export PGBACKREST_REPO1_S3_ENDPOINT="$PGBACKREST_S3_ENDPOINT"
export PGBACKREST_REPO1_S3_BUCKET="$PGBACKREST_S3_BUCKET"
export PGBACKREST_REPO1_S3_REGION="$PGBACKREST_S3_REGION"

set +e
pgbackrest --config="$PGBACKREST_CONFIG" --stanza="$PGBACKREST_STANZA" check
check_status=$?
if (( check_status == 0 )); then
  nice -n 10 ionice -c 3 pgbackrest --config="$PGBACKREST_CONFIG" --stanza="$PGBACKREST_STANZA" backup --type=full --repo=1
fi
set -e
end_ns="$(date +%s%N)"
status="failure"
if (( check_status == 0 )); then status="success"; fi
printf '%s\n' "{\"kind\":\"base\",\"status\":\"$status\",\"stanza\":\"$PGBACKREST_STANZA\",\"duration_ms\":$(( (end_ns - start_ns) / 1000000 )),\"external_repo\":true}" > "$BACKUP_REPORT_DIR/latest-base.json"
exit "$check_status"
