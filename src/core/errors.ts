/** Stable error taxonomy used by retry, logs and exit codes. */
import type { Phase } from './state/types.ts';
export type ErrorKind = 'transient' | 'permanent' | 'precondition' | 'cancelled';
export interface InfraErrorOptions { readonly kind?: ErrorKind; readonly phase?: Phase; readonly step?: string; readonly details?: Readonly<Record<string, unknown>>; readonly cause?: unknown; }
export class InfraError extends Error {
  readonly code: string; readonly kind: ErrorKind; readonly phase: Phase | undefined; readonly step: string | undefined; readonly details: Readonly<Record<string, unknown>>;
  constructor(code: string, message: string, options: InfraErrorOptions = {}) { super(message, options.cause === undefined ? undefined : { cause: options.cause }); this.name = 'InfraError'; this.code = code; this.kind = options.kind ?? 'permanent'; this.phase = options.phase; this.step = options.step; this.details = options.details ?? {}; }
  toJSON(): Record<string, unknown> { return { code: this.code, kind: this.kind, message: this.message, phase: this.phase, step: this.step, details: this.details }; }
}
export function transient(code: string, message: string, options: InfraErrorOptions = {}): InfraError { return new InfraError(code, message, { ...options, kind: 'transient' }); }
export function permanent(code: string, message: string, options: InfraErrorOptions = {}): InfraError { return new InfraError(code, message, { ...options, kind: 'permanent' }); }
export function precondition(code: string, message: string, options: InfraErrorOptions = {}): InfraError { return new InfraError(code, message, { ...options, kind: 'precondition' }); }
export function cancelled(message = 'operation cancelled'): InfraError { return new InfraError('E_CANCELLED', message, { kind: 'cancelled' }); }
export function isInfraError(value: unknown): value is InfraError { return value instanceof InfraError; }
export function isTransient(value: unknown): boolean { return isInfraError(value) && value.kind === 'transient'; }
export function toInfraError(value: unknown, fallbackCode = 'E_UNEXPECTED'): InfraError { if (isInfraError(value)) return value; if (value instanceof Error) { const code = (value as { code?: unknown }).code; const kind: ErrorKind = typeof code === 'string' && ['ECONNRESET','ECONNREFUSED','EHOSTUNREACH','ENETUNREACH','ETIMEDOUT','EPIPE','EAI_AGAIN','EBUSY'].includes(code) ? 'transient' : 'permanent'; return new InfraError(fallbackCode, value.message, { kind, cause: value }); } return new InfraError(fallbackCode, `non-error thrown: ${typeof value}`, { cause: value }); }
