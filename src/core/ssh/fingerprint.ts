import { appendFileSync, chmodSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname } from 'node:path';
import { createProcessRunner } from './process.ts';
import { buildKeyscanArgs } from './argv.ts';
import type { ProcessRunner } from './types.ts';
export interface HostFingerprint { readonly host: string; readonly port: number; readonly algorithm: string; readonly fingerprint: string; readonly knownHostLine: string; }
export async function scanHostFingerprint(host: string, port: number, runner: ProcessRunner = createProcessRunner()): Promise<HostFingerprint> { const result = await runner.run({ file: 'ssh-keyscan', args: buildKeyscanArgs(host, port), timeoutMs: 15000 }); const line = result.stdout.split('\n').map((item) => item.trim()).find((item) => item.length > 0 && !item.startsWith('#')); if (line === undefined) throw new Error('ssh-keyscan returned no host key'); const parts = line.split(/\s+/); const algorithm = parts[1]; const encoded = parts[2]; if (algorithm === undefined || encoded === undefined || parts.length < 3) throw new Error('ssh-keyscan returned malformed host key'); const digest = createHash('sha256').update(Buffer.from(encoded, 'base64')).digest('base64').replace(/=+$/u, '').replace(/\+/gu, '-').replace(/\//gu, '_'); return { host, port, algorithm, fingerprint: `SHA256:${digest}`, knownHostLine: line }; }
/** Call only after the operator explicitly confirms the displayed fingerprint. */
export function trustHostFingerprint(knownHostsFile: string, fingerprint: HostFingerprint): void { mkdirSync(dirname(knownHostsFile), { recursive: true, mode: 0o700 }); appendFileSync(knownHostsFile, `${fingerprint.knownHostLine}\n`, { mode: 0o600 }); chmodSync(knownHostsFile, 0o600); }
