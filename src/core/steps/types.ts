/** Every infrastructure mutation follows precheck -> apply -> verify, with optional rollback. */
import type { ProvisionConfig } from '../config/schema.ts';
import type { Logger } from '../logging/logger.ts';
import type { Phase } from '../state/types.ts';
import type { Clock } from '../util/time.ts';
export interface FactStore { set(key: string, value: unknown): void; get<T>(key: string): T | undefined; all(): Readonly<Record<string, unknown>>; }
export function createFactStore(initial: Readonly<Record<string, unknown>> = {}): FactStore { const facts = new Map(Object.entries(initial)); return { set: (key, value) => void facts.set(key, value), get: <T>(key: string) => facts.get(key) as T | undefined, all: () => Object.fromEntries(facts) }; }
export interface StepContext { readonly config: ProvisionConfig; readonly logger: Logger; readonly facts: FactStore; readonly clock: Clock; readonly signal: AbortSignal; readonly dryRun: boolean; }
export type PrecheckOutcome = { readonly action: 'apply' | 'satisfied'; readonly reason?: string; readonly details?: Readonly<Record<string, unknown>>; };
export const needsApply = (reason?: string): PrecheckOutcome => ({ action: 'apply', ...(reason === undefined ? {} : { reason }) });
export const alreadySatisfied = (reason?: string): PrecheckOutcome => ({ action: 'satisfied', ...(reason === undefined ? {} : { reason }) });
export interface Step { readonly id: string; readonly phase: Phase; readonly title: string; readonly destructive: boolean; readonly timeoutMs?: number; precheck(context: StepContext): Promise<PrecheckOutcome>; apply(context: StepContext): Promise<void>; verify(context: StepContext): Promise<void>; rollback?(context: StepContext): Promise<void>; }
export function defineStep(definition: Omit<Step, 'destructive'> & { readonly destructive?: boolean }): Step { return { ...definition, destructive: definition.destructive ?? false }; }
