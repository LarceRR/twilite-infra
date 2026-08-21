#!/usr/bin/env bash
set -Eeuo pipefail
: "${CHAOS_REPO_ROOT:?set repository root}"
: "${CHAOS_CONFIG:?set test config}"
: "${NODE_BIN:=node}"
"$NODE_BIN" "$CHAOS_REPO_ROOT/src/cli/main.ts" resume --config "$CHAOS_CONFIG" --yes
