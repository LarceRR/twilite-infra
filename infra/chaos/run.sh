#!/usr/bin/env bash
set -Eeuo pipefail
: "${CHAOS_SCENARIO:?set scenario id}"
: "${CHAOS_REPORT_DIR:?set report directory}"
: "${CHAOS_REPO_ROOT:?set repository root}"
NODE_BIN="${NODE_BIN:-node}"
install -d -m 700 "$CHAOS_REPORT_DIR"
started="$(date --iso-8601=seconds)"; status=0
case "$CHAOS_SCENARIO" in
  api-kill) docker kill "${PROD_API_CONTAINER:?set disposable API container}" ;;
  postgres-restart) docker restart "${POSTGRES_CONTAINER:?set disposable PostgreSQL container}" ;;
  redis-restart) docker restart "${REDIS_CONTAINER:?set disposable Redis container}" ;;
  openbao-restart) docker restart "${OPENBAO_CONTAINER:?set disposable OpenBao container}" ;;
  vm-reboot) "$NODE_BIN" "$CHAOS_REPO_ROOT/src/harness/vmctl/main.ts" reboot ;;
  network-loss) iptables -I OUTPUT 1 -m comment --comment twilite-chaos-network -j DROP; trap 'iptables -D OUTPUT -m comment --comment twilite-chaos-network -j DROP || true' EXIT ;;
  s3-failure) PGBACKREST_S3_FAILURE=1 bash "$CHAOS_REPO_ROOT/infra/backups/pgbackrest/backup.sh" || status=$? ;;
  disk-pressure) fallocate -l "${CHAOS_DISK_PRESSURE_BYTES:?set bounded pressure size}" "${CHAOS_PRESSURE_FILE:?set disposable pressure path}" || status=$? ;;
  memory-oom) systemd-run --scope -p "MemoryMax=${CHAOS_MEMORY_MAX:?set cgroup limit}" stress-ng --vm 1 --vm-bytes "${CHAOS_MEMORY_BYTES:?set bounded bytes}" --timeout 20s || status=$? ;;
  broken-release|migration-failure) MIGRATION_FAILURE=1 bash "$CHAOS_REPO_ROOT/infra/deploy/deploy.sh" || status=$? ;;
  unreadable-secret) chmod 000 "${CHAOS_SECRET_FILE:?set disposable secret fixture}" ;;
  corrupt-backup) truncate -s 1 "${CHAOS_BACKUP_COPY:?set disposable backup copy}" ;;
  failed-restore) RESTORE_TARGET_DIR=/run/twilite-invalid bash "$CHAOS_REPO_ROOT/infra/backups/pgbackrest/restore.sh" || status=$? ;;
  interrupted-provision) kill -INT "${PROVISION_PID:?set provisioning pid}" ;;
  partial-rerun) "$NODE_BIN" "$CHAOS_REPO_ROOT/src/cli/main.ts" resume --config "${CHAOS_CONFIG:?set test config}" --yes || status=$? ;;
  vps-loss) "$NODE_BIN" "$CHAOS_REPO_ROOT/src/harness/vmctl/main.ts" destroy ;;
  *) echo "unknown chaos scenario: $CHAOS_SCENARIO" >&2; exit 2 ;;
esac
finished="$(date --iso-8601=seconds)"
printf '%s\n' "{\"scenario\":\"$CHAOS_SCENARIO\",\"started_at\":\"$started\",\"finished_at\":\"$finished\",\"injection_status\":$status}" > "$CHAOS_REPORT_DIR/$CHAOS_SCENARIO.json"
exit "$status"
