#!/usr/bin/env bash
set -Eeuo pipefail

: "${DR_RUN_ID:?set unique drill id}"
: "${DR_REPORT_DIR:?set report directory}"
: "${DR_REPO_ROOT:?set repository root}"
: "${DR_CONFIG:?set local VM config}"
: "${DR_EXTERNAL_STATE_DIR:?set external backup/recovery state directory}"

[[ "$DR_RUN_ID" =~ ^[A-Za-z0-9._-]+$ ]] || { echo 'unsafe DR run id' >&2; exit 2; }
install -d -m 700 "$DR_REPORT_DIR/$DR_RUN_ID"
started="$(date --iso-8601=seconds)"
step_report="$DR_REPORT_DIR/$DR_RUN_ID/steps.jsonl"
: > "$step_report"
run_step() { local action="$1"; shift; local start end status=success; start="$(date +%s)"; if "$@"; then :; else status=failed; fi; end="$(date +%s)"; printf '%s\n' "{\"action\":\"$action\",\"status\":\"$status\",\"duration_seconds\":$((end-start))}" >> "$step_report"; [[ "$status" == success ]]; }

run_step destroy bash "$DR_REPO_ROOT/src/harness/vmctl/main.ts" destroy
run_step provision bash "$DR_REPO_ROOT/src/harness/vmctl/main.ts" create
run_step restore-secrets bash "$DR_REPO_ROOT/infra/openbao/dr/restore-access.sh"
run_step restore-database bash "$DR_REPO_ROOT/infra/backups/pgbackrest/restore.sh"
run_step restore-release bash "$DR_REPO_ROOT/infra/deploy/rollback.sh"
run_step smoke bash "$DR_REPO_ROOT/infra/dr/smoke.sh"
# DNS switching is deliberately an explicit operator action and is always recorded.
if [[ "${DR_SWITCH_TEST_DNS:-0}" == 1 ]]; then run_step switch-test-dns bash "$DR_REPO_ROOT/infra/dr/switch-test-dns.sh"; else printf '%s\n' '{"action":"switch-test-dns","status":"pending","manual_action":"operator must switch disposable test DNS"}' >> "$step_report"; fi
finished="$(date --iso-8601=seconds)"
cp "$step_report" "$DR_REPORT_DIR/$DR_RUN_ID/report.jsonl"
printf '%s\n' "{\"drill_id\":\"$DR_RUN_ID\",\"started_at\":\"$started\",\"finished_at\":\"$finished\",\"report\":\"$step_report\"}" > "$DR_REPORT_DIR/$DR_RUN_ID/summary.json"
