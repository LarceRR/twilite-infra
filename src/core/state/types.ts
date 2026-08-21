/** Provisioning phases in the exact §2 order. */
export const PHASES = ['CONNECT','PREFLIGHT','SSH_BASELINE','OS_BASELINE','SECURITY','DOCKER','OPENBAO','STORAGE','MONITORING','RUNTIME_BASELINE','HEALTH_CHECK','READY'] as const;
export type Phase = (typeof PHASES)[number];
export const STEP_STATUSES = ['pending','running','success','skipped','failed','rolled_back'] as const;
export type StepStatus = (typeof STEP_STATUSES)[number];
export const RUN_STATUSES = ['pending','running','completed','failed','cancelled'] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];
export const TERMINAL_STEP_STATUSES: readonly StepStatus[] = ['success','skipped'];
export interface StepRecord { readonly stepId: string; readonly phase: Phase; readonly status: StepStatus; readonly attempts: number; readonly startedAt?: string; readonly finishedAt?: string; readonly durationMs?: number; readonly message?: string; readonly errorCode?: string; readonly details?: Readonly<Record<string, unknown>>; }
export interface RunState { readonly schemaVersion: number; readonly runId: string; readonly createdAt: string; readonly updatedAt: string; readonly configFingerprint: string; readonly target: { readonly host: string; readonly label: string }; readonly cliVersion: string; readonly phase: Phase; readonly status: RunStatus; readonly dryRun: boolean; readonly steps: Readonly<Record<string, StepRecord>>; readonly completedPhases: readonly Phase[]; }
export const STATE_SCHEMA_VERSION = 1;
export function phaseIndex(phase: Phase): number { const index = PHASES.indexOf(phase); if (index < 0) throw new Error(`unknown phase: ${phase}`); return index; }
export function isPhase(value: unknown): value is Phase { return typeof value === 'string' && (PHASES as readonly string[]).includes(value); }
