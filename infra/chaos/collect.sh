#!/usr/bin/env bash
set -Eeuo pipefail
: "${CHAOS_REPORT_DIR:?set report directory}"
: "${CHAOS_COLLECT_DIR:?set collection directory}"
install -d -m 700 "$CHAOS_COLLECT_DIR"
find "$CHAOS_REPORT_DIR" -maxdepth 1 -type f -name '*.json' -print0 | sort -z | xargs -0r cat > "$CHAOS_COLLECT_DIR/scenarios.jsonl"
docker ps -a --no-trunc > "$CHAOS_COLLECT_DIR/docker-ps.txt" 2>&1 || true
journalctl -u docker --since '30 min ago' --no-pager > "$CHAOS_COLLECT_DIR/docker-journal.txt" 2>&1 || true
ss -lntup > "$CHAOS_COLLECT_DIR/listening-ports.txt" 2>&1 || true
printf '%s\n' 'chaos artifacts collected'
