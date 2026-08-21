#!/usr/bin/env bash
set -Eeuo pipefail
: "${DEADMAN_URL:?set independent dead-man endpoint}"
: "${DEADMAN_TOKEN_FILE:?set root-only token file}"
token="$(<"$DEADMAN_TOKEN_FILE")"
[[ -n "$token" ]] || { echo 'dead-man token is empty' >&2; exit 2; }
curl --fail --silent --show-error --max-time 10 --header "Authorization: Bearer $token" --data '{"status":"alive"}' "$DEADMAN_URL" >/dev/null
