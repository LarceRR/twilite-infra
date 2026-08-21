#!/usr/bin/env bash
set -Eeuo pipefail
: "${PROBE_URL:?set HTTPS endpoint}"
: "${TEXTFILE_DIR:?set node-exporter textfile directory}"
status=0
curl --fail --silent --show-error --max-time 15 "$PROBE_URL/health/ready" >/dev/null || status=1
tmp="$TEXTFILE_DIR/twilite-external.prom.$$"
printf '# HELP twilite_external_probe_up External HTTPS probe health.\n# TYPE twilite_external_probe_up gauge\ntwilite_external_probe_up %s\n' "$((1-status))" > "$tmp"
mv "$tmp" "$TEXTFILE_DIR/twilite-external.prom"
exit "$status"
