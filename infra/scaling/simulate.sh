#!/usr/bin/env bash
set -Eeuo pipefail
: "${SCALING_PROFILE:?set profile name}"
: "${SCALING_REPORT:?set report path}"
python3 - "$SCALING_PROFILE" "$SCALING_REPORT" <<'PY'
import json, sys
profiles = {
  'vps-2gb': {'memory_mib': 2048, 'cpus': 2, 'app_nodes': 1, 'postgres': 'same-host', 'redis': 'same-host', 'openbao_nodes': 1},
  'vps-8gb': {'memory_mib': 8192, 'cpus': 4, 'app_nodes': 1, 'postgres': 'same-host', 'redis': 'same-host', 'openbao_nodes': 1},
  'split-data': {'memory_mib': 8192, 'cpus': 4, 'app_nodes': 1, 'postgres': 'dedicated', 'redis': 'dedicated', 'openbao_nodes': 1},
  'multi-api': {'memory_mib': 16384, 'cpus': 8, 'app_nodes': 2, 'postgres': 'dedicated', 'redis': 'dedicated', 'openbao_nodes': 3},
}
profile = profiles.get(sys.argv[1])
if profile is None:
    raise SystemExit('unknown scaling profile')
report = {'profile': sys.argv[1], 'resource_change_only': True, 'application_redesign_required': False, 'profile': profile}
with open(sys.argv[2], 'w', encoding='utf-8') as handle:
    json.dump(report, handle, indent=2)
PY
printf '%s\n' "scaling simulation written to $SCALING_REPORT"
