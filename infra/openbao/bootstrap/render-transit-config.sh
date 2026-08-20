#!/usr/bin/env bash
set -Eeuo pipefail

: "${TRANSIT_ADDRESS:?set external Transit address}":
: "${TRANSIT_KEY_NAME:?set Transit key name}":
: "${TRANSIT_MOUNT_PATH:?set Transit mount path}":
: "${OPENBAO_CONFIG_OUTPUT:?set output path outside the repository}":

case "$TRANSIT_ADDRESS" in *[[:space:]"]'"'"'\\$]* ) echo 'unsafe transit address' >&2; exit 2;; esac
install -d -m 700 "$(dirname "$OPENBAO_CONFIG_OUTPUT")"
cat > "$OPENBAO_CONFIG_OUTPUT" <<EOF
seal "transit" {
  address         = "$TRANSIT_ADDRESS"
  key_name        = "$TRANSIT_KEY_NAME"
  mount_path      = "$TRANSIT_MOUNT_PATH"
  disable_renewal = "false"
}
EOF
chmod 600 "$OPENBAO_CONFIG_OUTPUT"
