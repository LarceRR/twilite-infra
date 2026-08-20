#!/usr/bin/env bash
set -Eeuo pipefail

: "${OPENBAO_ADDR:?set OPENBAO_ADDR}"
: "${OPENBAO_TOKEN_FILE:?set root bootstrap token file outside the repo}"

export BAO_ADDR="$OPENBAO_ADDR"
export BAO_TOKEN="$(<"$OPENBAO_TOKEN_FILE")"
chmod 600 "$OPENBAO_TOKEN_FILE"

bao secrets enable -path=secret kv-v2 2>/dev/null || true
bao audit enable file file_path=/openbao/data/audit.log 2>/dev/null || true
bao policy write production-api /openbao/policies/production-api.hcl
bao policy write staging-api /openbao/policies/staging-api.hcl
bao policy write deployer /openbao/policies/deployer.hcl
bao policy write backup /openbao/policies/backup.hcl

unset BAO_TOKEN
