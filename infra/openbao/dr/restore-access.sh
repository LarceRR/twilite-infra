#!/usr/bin/env bash
set -Eeuo pipefail
: "${OPENBAO_ADDR:?set restored OpenBao address}"
: "${RECOVERY_MATERIAL_DIR:?set external recovery material directory}"
: "${OPENBAO_CONFIG_OUTPUT:?set output path outside repository}"
[[ -d "$RECOVERY_MATERIAL_DIR" ]] || { echo 'recovery material missing' >&2; exit 1; }
[[ -f "$RECOVERY_MATERIAL_DIR/recovery-keys" ]] || { echo 'offline recovery keys missing' >&2; exit 1; }
install -d -m 700 "$(dirname -- "$OPENBAO_CONFIG_OUTPUT")"
install -m 600 "$RECOVERY_MATERIAL_DIR/recovery-keys" "$OPENBAO_CONFIG_OUTPUT"
printf '%s\n' 'OpenBao recovery access material restored from external state'
