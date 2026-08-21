export type AlertSeverity = 'critical' | 'warning' | 'info';
export interface MetricDefinition { readonly name: string; readonly help: string; readonly labels: readonly string[]; readonly source: 'host' | 'container' | 'external' | 'backup' | 'deployment'; }
export interface AlertDefinition { readonly name: string; readonly severity: AlertSeverity; readonly expr: string; readonly owner: string; readonly runbook: string; readonly for: string; }
export interface MonitoringContract { readonly metrics: readonly MetricDefinition[]; readonly alerts: readonly AlertDefinition[]; readonly deadManIntervalSeconds: number; }
export const monitoringContract: MonitoringContract = {
  deadManIntervalSeconds: 60,
  metrics: [
    { name: 'twilite_host_cpu_ratio', help: 'Host CPU utilisation ratio', labels: ['host'], source: 'host' },
    { name: 'twilite_host_memory_ratio', help: 'Host memory utilisation ratio', labels: ['host'], source: 'host' },
    { name: 'twilite_host_swap_bytes', help: 'Host swap bytes used', labels: ['host'], source: 'host' },
    { name: 'twilite_host_disk_free_ratio', help: 'Host filesystem free ratio', labels: ['host', 'mount'], source: 'host' },
    { name: 'twilite_host_inode_free_ratio', help: 'Host inode free ratio', labels: ['host', 'mount'], source: 'host' },
    { name: 'twilite_container_restarts_total', help: 'Container restart count', labels: ['environment', 'service'], source: 'container' },
    { name: 'twilite_api_request_duration_seconds', help: 'API request latency', labels: ['environment', 'route'], source: 'container' },
    { name: 'twilite_api_errors_total', help: 'API errors', labels: ['environment', 'route'], source: 'container' },
    { name: 'twilite_postgres_up', help: 'PostgreSQL health', labels: ['environment'], source: 'container' },
    { name: 'twilite_redis_up', help: 'Redis health', labels: ['environment'], source: 'container' },
    { name: 'twilite_openbao_sealed', help: 'OpenBao seal state', labels: [], source: 'container' },
    { name: 'twilite_wal_archive_age_seconds', help: 'Age of newest archived WAL', labels: [], source: 'backup' },
    { name: 'twilite_restore_last_success_timestamp', help: 'Last successful restore drill timestamp', labels: [], source: 'backup' },
    { name: 'twilite_deployment_last_result', help: 'Last deployment result', labels: ['environment'], source: 'deployment' },
    { name: 'twilite_external_probe_up', help: 'External HTTPS probe health', labels: ['target'], source: 'external' },
  ],
  alerts: [
    { name: 'TwiliteHostMemoryHigh', severity: 'critical', expr: 'twilite_host_memory_ratio > 0.80', owner: 'infra-oncall', runbook: 'runbooks/host-memory.md', for: '10m' },
    { name: 'TwiliteSwapUsed', severity: 'warning', expr: 'twilite_host_swap_bytes > 0', owner: 'infra-oncall', runbook: 'runbooks/resource-pressure.md', for: '5m' },
    { name: 'TwiliteDiskPressure', severity: 'critical', expr: 'twilite_host_disk_free_ratio < 0.15 or twilite_host_inode_free_ratio < 0.10', owner: 'infra-oncall', runbook: 'runbooks/disk-pressure.md', for: '5m' },
    { name: 'TwiliteContainerRestartLoop', severity: 'critical', expr: 'rate(twilite_container_restarts_total[10m]) > 0.1', owner: 'app-oncall', runbook: 'runbooks/restart-loop.md', for: '5m' },
    { name: 'TwiliteApiErrors', severity: 'critical', expr: 'rate(twilite_api_errors_total[5m]) > 0.05', owner: 'app-oncall', runbook: 'runbooks/api-errors.md', for: '5m' },
    { name: 'TwiliteWalArchiveStale', severity: 'critical', expr: 'twilite_wal_archive_age_seconds > 180', owner: 'data-oncall', runbook: 'runbooks/wal-archive.md', for: '3m' },
    { name: 'TwiliteOpenBaoSealed', severity: 'critical', expr: 'twilite_openbao_sealed == 1', owner: 'infra-oncall', runbook: 'runbooks/openbao-recovery.md', for: '2m' },
    { name: 'TwiliteExternalProbeDown', severity: 'critical', expr: 'twilite_external_probe_up == 0', owner: 'infra-oncall', runbook: 'runbooks/external-probe.md', for: '2m' },
    { name: 'TwiliteDeadManMissing', severity: 'critical', expr: 'absent_over_time(twilite_deadman_heartbeat[3m])', owner: 'infra-oncall', runbook: 'runbooks/dead-man-switch.md', for: '1m' },
  ],
};
export function validateMonitoringContract(contract: MonitoringContract = monitoringContract): void { const names = new Set<string>(); for (const metric of contract.metrics) { if (names.has(metric.name)) throw new Error(`duplicate metric: ${metric.name}`); names.add(metric.name); } for (const alert of contract.alerts) { if (!alert.owner || !alert.runbook || !alert.expr) throw new Error(`alert ${alert.name} is missing owner, runbook or expression`); } if (contract.deadManIntervalSeconds < 30) throw new Error('dead-man interval is too aggressive'); }
