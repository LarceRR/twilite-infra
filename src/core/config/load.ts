import { readFileSync } from 'node:fs';
import { permanent } from '../errors.ts';
import { err, ok, type Result } from '../result.ts';
import { fingerprint } from '../util/ids.ts';
import { assertBudget } from './resource-budget.ts';
import { provisionConfigCheck, type ProvisionConfig } from './schema.ts';
import { toError } from './validate.ts';
export interface ResolvedConfig { readonly config: ProvisionConfig; readonly source: string; readonly fingerprint: string; }
export function resolveConfig(raw: unknown, source: string): Result<ResolvedConfig> { const checked = provisionConfigCheck(raw, ''); if (!checked.ok) return err(toError(checked.issues, source)); const budget = assertBudget(checked.value.budget); if (!budget.ok) return err(budget.error); return ok({ config: checked.value, source, fingerprint: fingerprint(checked.value) }); }
export function loadConfigFile(path: string): Result<ResolvedConfig> { let text: string; try { text = readFileSync(path, 'utf8'); } catch (cause) { return err(permanent('E_CONFIG_UNREADABLE', `cannot read configuration file: ${path}`, { cause })); } try { return resolveConfig(JSON.parse(stripJsonComments(text)), path); } catch (cause) { return err(permanent('E_CONFIG_MALFORMED', `configuration file is not valid JSON: ${path}`, { cause })); } }
export function stripJsonComments(input: string): string { let output = ''; let inString = false; let line = false; let block = false; for (let i = 0; i < input.length; i += 1) { const c = input[i] ?? ''; const n = input[i + 1] ?? ''; if (line) { if (c === '\n') { line = false; output += c; } continue; } if (block) { if (c === '*' && n === '/') { block = false; i += 1; } continue; } if (inString) { output += c; if (c === '\\') { output += n; i += 1; } else if (c === '"') inString = false; continue; } if (c === '"') { inString = true; output += c; continue; } if (c === '/' && n === '/') { line = true; i += 1; continue; } if (c === '/' && n === '*') { block = true; i += 1; continue; } output += c; } return output; }
