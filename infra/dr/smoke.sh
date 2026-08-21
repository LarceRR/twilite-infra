#!/usr/bin/env bash
set -Eeuo pipefail
: "${DR_SMOKE_URL:?set restored production-like smoke URL}"
curl --fail --silent --show-error --max-time 20 "$DR_SMOKE_URL/health/ready" >/dev/null
curl --fail --silent --show-error --max-time 20 "$DR_SMOKE_URL/health/live" >/dev/null
printf '%s\n' 'DR smoke passed'
