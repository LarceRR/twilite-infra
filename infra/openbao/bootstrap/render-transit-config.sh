#!/usr/bin/env bash
set -Eeuo pipefail

: "${TRANSIT_ADDRESS:?set external Transit address}"
: "${TRANSIT_KEY_NAME:?set Transit key name}"
: "${TRANSIT_MOUNT_PATH:?set Transit mount path}"
: "${OPENBAO_CONFIG_OUTPUT:?set output path outside the repository}"

[[ "$TRANSIT_ADDRESS" =~ ^https://[A-Za-z0-9._:/-]+$ ]] || { echo 'unsafe transit address' >&2; exit 2; }
[[ "$TRANSIT_KEY_NAME" =~ ^[A-Za-z0-9._/-]+$ ]] || { echo 'unsafe transit key name' >&2; exit 2; }
[[ "$TRANSIT_MOUNT_PATH" =~ ^[A-Za-z0-9._/-]+$ ]] || { echo 'unsafe transit mount path' >&2; exit 2; }

install -d -m 700 "$(dirname -- "$OPENBAO_CONFIG_OUTPUT")"
printf 'seal "transit" {\n  address = "%s"\n  key_name = "%s"\n  mount_path = "%s"\n  disable_renewal = "false"\n}\n' "$TRANSIT_ADDRESS" "$TRANSIT_KEY_NAME" "$TRANSIT_MOUNT_PATH" > "$OPENBAO_CONFIG_OUTPUT"
chmod 600 "$OPENBAO_CONFIG_OUTPUT"
