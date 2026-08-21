import { match, ok, strictEqual } from 'node:assert/strict';
import { test } from 'node:test';
import { resolveConfig } from '../../src/core/config/load.ts';
import { buildPasswordControlMasterArgs, buildSshArgs } from '../../src/core/ssh/argv.ts';
import type { SshTarget } from '../../src/core/ssh/types.ts';

const target: SshTarget = { host: '185.159.82.250', port: 22, user: 'vps', knownHostsFile: '/tmp/known_hosts', controlPath: '/tmp/twilite-cm' };

test('password bootstrap argv contains no password and keeps strict host verification', () => {
  const args = buildPasswordControlMasterArgs(target);
  const joined = args.join(' ');
  match(joined, /PreferredAuthentications=password/);
  match(joined, /PubkeyAuthentication=no/);
  match(joined, /StrictHostKeyChecking=yes/);
  match(joined, /UserKnownHostsFile=\/tmp\/known_hosts/);
  strictEqual(args.some((arg) => arg.toLowerCase().includes('password=')), false);
  strictEqual(args.some((arg) => arg === 'secret' || arg === 'hunter2'), false);
});

test('password bootstrap rejects unsafe host, user and known-host paths', () => {
  for (const bad of [
    { ...target, host: '-oProxyCommand=bad' },
    { ...target, user: 'vps;id' },
    { ...target, knownHostsFile: '/tmp/known hosts' },
  ]) {
    try { buildPasswordControlMasterArgs(bad); ok(false, 'unsafe input must be rejected'); } catch { ok(true); }
  }
});

test('key transport remains strict and never receives a password argument', () => {
  const args = buildSshArgs({ ...target, identityFile: '/tmp/id_ed25519' }, ['id', '-u']);
  match(args.join(' '), /BatchMode=yes/);
  match(args.join(' '), /StrictHostKeyChecking=yes/);
  strictEqual(args.some((arg) => arg.toLowerCase().includes('password')), false);
});

test('legacy config remains key-compatible and explicit modes validate', () => {
  const legacy = resolveConfig({ target: { host: '127.0.0.1', identityPath: '/tmp/id' }, openbao: { unsealMode: 'manual' }, security: { publicPorts: [] } }, 'legacy');
  ok(legacy.ok);
  if (legacy.ok) strictEqual(legacy.value.config.target.initialAuth.mode, 'auto');
  const password = resolveConfig({ target: { host: '127.0.0.1', initialAuth: { mode: 'password' } }, openbao: { unsealMode: 'manual' }, security: { publicPorts: [] } }, 'password');
  ok(password.ok);
  const invalidKey = resolveConfig({ target: { host: '127.0.0.1', initialAuth: { mode: 'key' } }, openbao: { unsealMode: 'manual' }, security: { publicPorts: [] } }, 'invalid');
  ok(!invalidKey.ok);
});
