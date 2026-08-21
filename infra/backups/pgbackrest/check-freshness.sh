#!/usr/bin/env bash
set -Eeuo pipefail

: "${PGBACKREST_STANZA:?set stanza}"
: "${PGBACKREST_CONFIG:?set config path}"
MAX_AGE_SECONDS="${MAX_ARCHIVE_AGE_SECONDS:-180}"
last_archive="$(pgbackrest --config="$PGBACKREST_CONFIG" --stanza="$PGBACKREST_STANZA" info --output=json | python3 -c 'import json,sys; data=json.load(sys.stdin); print(data[0]["archive"][ -1 ]["max"] if data and data[0].get("archive") else "")')"
[[ -n "$last_archive" ]] || { echo 'no archived WAL segment found' >&2; exit 1; }
last_epoch="$(date --date="${last_archive:0:4}-${last_archive:4:2}-${last_archive:6:2} ${last_archive:8:2}:${last_archive:10:2}:${last_archive:12:2} UTC" +%s)"
now_epoch="$(date +%s)"
age=$(( now_epoch - last_epoch ))
(( age <= MAX_AGE_SECONDS )) || { echo "WAL archive freshness ${age}s exceeds ${MAX_AGE_SECONDS}s" >&2; exit 1; }
printf '%s\n' "WAL archive freshness ${age}s"
