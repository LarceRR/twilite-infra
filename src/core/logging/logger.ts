import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
export interface LogRecord { readonly timestamp: string; readonly level: LogLevel; readonly event: string; readonly runId: string; readonly phase?: string; readonly step?: string; readonly status?: string; readonly duration_ms?: number; readonly details: Record<string, unknown>; }
export interface Logger { readonly records: readonly LogRecord[]; log(level: LogLevel, event: string, details?: Record<string, unknown>): void; }
export function createLogger(runId: string, path?: string): Logger { const records: LogRecord[] = []; return { records, log(level, event, details = {}) { const record = { timestamp: new Date().toISOString(), level, event, runId, details }; records.push(record); if (path !== undefined) { mkdirSync(dirname(path), { recursive: true }); appendFileSync(path, `${JSON.stringify(record)}\n`, 'utf8'); } } }; }
