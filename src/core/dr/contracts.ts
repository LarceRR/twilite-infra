export type DrAction = 'destroy' | 'provision' | 'restore-secrets' | 'restore-database' | 'restore-release' | 'smoke' | 'switch-test-dns';
export interface DrStep { readonly order: number; readonly action: DrAction; readonly command: readonly string[]; readonly manual: boolean; }
export interface DrDrillReport { readonly drillId: string; readonly startedAt: string; readonly finishedAt?: string; readonly steps: readonly { readonly action: DrAction; readonly status: 'pending' | 'success' | 'failed'; readonly durationSeconds?: number; readonly manualAction?: string }[]; readonly measuredRpoSeconds?: number; readonly measuredRtoSeconds?: number; readonly undocumentedManualActions: readonly string[]; readonly success: boolean; }
export const drSteps: readonly DrStep[] = [
  { order: 1, action: 'destroy', command: ['vmctl', 'destroy'], manual: false },
  { order: 2, action: 'provision', command: ['vmctl', 'create'], manual: false },
  { order: 3, action: 'restore-secrets', command: ['bash', 'infra/openbao/dr/restore-access.sh'], manual: false },
  { order: 4, action: 'restore-database', command: ['bash', 'infra/backups/pgbackrest/restore.sh'], manual: false },
  { order: 5, action: 'restore-release', command: ['bash', 'infra/deploy/rollback.sh'], manual: false },
  { order: 6, action: 'smoke', command: ['bash', 'infra/dr/smoke.sh'], manual: false },
  { order: 7, action: 'switch-test-dns', command: ['bash', 'infra/dr/switch-test-dns.sh'], manual: true },
];
export function validateDrReport(report: DrDrillReport): void { if (!report.success) throw new Error('DR drill failed'); if (report.steps.some((step) => step.status !== 'success')) throw new Error('DR drill contains failed steps'); if (report.undocumentedManualActions.length > 0) throw new Error('DR drill contains undocumented manual actions'); if (report.measuredRtoSeconds !== undefined && report.measuredRtoSeconds > 3600) throw new Error('DR RTO exceeds 60-minute target'); }
export function isLocalDoDReady(first: DrDrillReport, second: DrDrillReport): boolean { try { validateDrReport(first); validateDrReport(second); return first.drillId !== second.drillId; } catch { return false; } }
