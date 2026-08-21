#!/usr/bin/env bash
set -Eeuo pipefail

: "${PGBACKREST_CONFIG:?set pgBackRest config path}"
: "${PGBACKREST_STANZA:?set stanza}"
: "${PGBACKREST_REPO_CIPHER_PASS_FILE:?set root-only cipher material path}"
: "${RESTORE_TARGET_DIR:?set isolated restore target}"
: "${RESTORE_REPORT:?set restore report path}"

[[ "$RESTORE_TARGET_DIR" != /var/lib/postgresql/data* ]] || { echo 'restore target must be isolated from production data' >&2; exit 2; }
install -d -m 700 "$RESTORE_TARGET_DIR" "$(dirname -- "$RESTORE_REPORT")"
start_ns="$(date +%s%N)"
export PGBACKREST_REPO1_CIPHER_PASS_FILE="$PGBACKREST_REPO_CIPHER_PASS_FILE"
pgbackrest --config="$PGBACKREST_CONFIG" --stanza="$PGBACKREST_STANZA" restore --delta --pg1-path="$RESTORE_TARGET_DIR" --type=time ${PITR_TARGET:+"--target=$PITR_TARGET"}
end_ns="$(date +%s%N)"
printf '%s\n' "{\"artifact\":\"$PGBACKREST_STANZA\",\"validations\":[\"download\",\"decrypt\",\"restore\"],\"duration_ms\":$(( (end_ns - start_ns) / 1000000 )),\"staging_reseed_required\":true,\"success\":true}" > "$RESTORE_REPORT"
