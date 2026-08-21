import { match, ok, strictEqual } from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { assertRecoveryReport, buildPgBackrestBackupCommand, buildPgBackrestRestoreCommand, defaultBackupPolicy } from '../../src/core/backup/contracts.ts';
import { chaosScenarios, getChaosScenario } from '../../src/core/chaos/contracts.ts';
import { monitoringContract, validateMonitoringContract } from '../../src/core/monitoring/contracts.ts';

const read = (path: string): string => readFileSync(path, 'utf8');

test('backup policy enforces five-minute WAL intent and cluster-wide staging reseed', () => {
  strictEqual(defaultBackupPolicy.rpoMinutes, 5);
  strictEqual(defaultBackupPolicy.archiveTimeoutSeconds, 60);
  strictEqual(defaultBackupPolicy.freshnessAlertSeconds, 180);
  strictEqual(defaultBackupPolicy.stagingExpendable, true);
  const backup = buildPgBackrestBackupCommand({ stanza: 'twilite', configPath: '/etc/pgbackrest.conf', repoCipherPassFile: '/run/recovery/cipher' });
  strictEqual(backup.args.includes('--type=full'), true);
  strictEqual(backup.env.PGBACKREST_REPO1_CIPHER_PASS_FILE, '/run/recovery/cipher');
  const restore = buildPgBackrestRestoreCommand({ stanza: 'twilite', configPath: '/etc/pgbackrest.conf', targetTimestamp: '2026-08-21 10:00:00+00' });
  match(restore.args.join(' '), /--target=2026-08-21 10:00:00\+00/);
});

test('restore report requires download, decrypt, restore, integrity and smoke evidence', () => {
  const report = { artifact: 'backup-001', validations: ['download', 'decrypt', 'restore', 'integrity', 'smoke'] as const, stagingReseedRequired: true, measuredRpoSeconds: 120, measuredRtoSeconds: 900, success: true };
  assertRecoveryReport(report);
  ok(report.success);
});

test('monitoring contract has owners, runbooks and a dead-man alert', () => {
  validateMonitoringContract();
  strictEqual(monitoringContract.deadManIntervalSeconds, 60);
  ok(monitoringContract.metrics.some((metric) => metric.name === 'twilite_wal_archive_age_seconds'));
  ok(monitoringContract.alerts.some((alert) => alert.name === 'TwiliteDeadManMissing'));
  for (const alert of monitoringContract.alerts) { ok(alert.owner.length > 0); ok(alert.runbook.startsWith('runbooks/')); }
});

test('chaos matrix contains every P0 failure class from the development plan', () => {
  const ids = new Set(chaosScenarios.map((scenario) => scenario.id));
  for (const required of ['api-kill', 'postgres-restart', 'redis-restart', 'openbao-restart', 'vm-reboot', 'network-loss', 's3-failure', 'disk-pressure', 'memory-oom', 'broken-release', 'migration-failure', 'unreadable-secret', 'corrupt-backup', 'failed-restore', 'interrupted-provision', 'partial-rerun', 'vps-loss']) ok(ids.has(required), required);
  strictEqual(getChaosScenario('broken-release').expectedRecovery, 'rollback');
  strictEqual(getChaosScenario('vps-loss').expectedDataIntegrity, 'restored');
});

test('backup, monitoring and chaos shell contracts do not contain literal credentials', () => {
  const paths = ['infra/backups/pgbackrest/backup.sh', 'infra/backups/pgbackrest/restore.sh', 'infra/monitoring/scripts/dead-man-ping.sh', 'infra/chaos/run.sh'];
  for (const path of paths) { const text = read(path); strictEqual(/AKIA[0-9A-Z]{16}/u.test(text), false); strictEqual(/BEGIN (RSA|OPENSSH) PRIVATE KEY/u.test(text), false); }
});
