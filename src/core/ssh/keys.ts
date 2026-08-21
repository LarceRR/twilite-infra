import { chmodSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { uniqueSuffix } from '../util/ids.ts';
export interface GeneratedKeyPair { readonly privateKeyPath: string; readonly publicKeyPath: string; readonly comment: string; }
export function generateEd25519KeyPair(directory: string, label: string, now = new Date()): GeneratedKeyPair { mkdirSync(directory, { recursive: true, mode: 0o700 }); const stamp = now.toISOString().replace(/[-:.TZ]/gu, '').slice(0, 14); const base = join(directory, `id_ed25519-${safeLabel(label)}-${stamp}`); const existing = readdirSync(directory).map((entry) => join(directory, entry)); const privateKeyPath = uniqueSuffix(existing, base); const publicKeyPath = `${privateKeyPath}.pub`; const result = spawnSync('ssh-keygen', ['-q', '-t', 'ed25519', '-N', '', '-f', privateKeyPath, '-C', `${label}-${stamp}`], { encoding: 'utf8', shell: false }); if (result.error !== undefined) throw result.error; if (result.status !== 0) throw new Error(`ssh-keygen failed: ${result.stderr.trim() || `exit ${result.status}`}`); chmodSync(privateKeyPath, 0o600); chmodSync(publicKeyPath, 0o644); return { privateKeyPath, publicKeyPath, comment: `${label}-${stamp}` }; }
export function validatePrivateKeyPath(path: string): void {
  if (!existsSync(path)) throw new Error(`private SSH key does not exist: ${path}`);
  if (Array.from(path).some((character) => character.charCodeAt(0) === 0 || character.charCodeAt(0) === 10)) throw new Error('private SSH key path contains unsafe characters');
  const mode = statSync(path).mode & 0o777;
  const allowed = mode === 0o600 || mode === 0o400;
  if (!allowed) throw new Error(`private SSH key must be mode 0600 or 0400: ${path}`);
}
function safeLabel(value: string): string { const normalized = value.replace(/[^A-Za-z0-9._-]+/gu, '-').replace(/^-+|-+$/gu, ''); return normalized.length > 0 ? normalized.slice(0, 40) : 'admin'; }
