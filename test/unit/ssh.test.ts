import { match, ok, strictEqual } from 'node:assert/strict';
import { mkdtempSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { buildControlCloseArgs, buildSshArgs } from '../../src/core/ssh/argv.ts';
import { bootstrapSsh } from '../../src/core/ssh/bootstrap.ts';
import { scanHostFingerprint } from '../../src/core/ssh/fingerprint.ts';
import { buildHardeningPlan, renderAuthorizedKeys, renderSudoers } from '../../src/core/ssh/hardening.ts';
import { generateEd25519KeyPair, validatePrivateKeyPath } from '../../src/core/ssh/keys.ts';
import { ATOMIC_WRITE_SCRIPT } from '../../src/core/ssh/transport.ts';
import type { CommandResult, ProcessRunner, SshTransport } from '../../src/core/ssh/types.ts';
const target = { host: '127.0.0.1', port: 5564, user: 'lumiadmin', identityFile: '/tmp/key', knownHostsFile: '/tmp/known_hosts', controlPath: '/tmp/cm-test' } as const;
test('SSH argv enforces strict host keys, BatchMode and ControlMaster', () => { const args = buildSshArgs(target, ['id', '-u']); ok(args.includes('BatchMode=yes')); ok(args.includes('StrictHostKeyChecking=yes')); ok(args.includes('ControlMaster=auto')); strictEqual(args.at(-1), '-u'); const closeArgs = buildControlCloseArgs(target); strictEqual(closeArgs.at(-3), '-O'); strictEqual(closeArgs.at(-2), 'exit'); });
test('SSH argv rejects option injection', () => { try { buildSshArgs({ ...target, host: '-oProxyCommand=evil' }, []); ok(false); } catch (error) { match(String(error), /unsafe SSH token/); } });
test('atomic remote write is temp + fsync + rename, not direct overwrite', () => { match(ATOMIC_WRITE_SCRIPT, /mktemp/); match(ATOMIC_WRITE_SCRIPT, /sync -f/); match(ATOMIC_WRITE_SCRIPT, /mv -f/); });
test('fingerprint parser hashes the SSH public key blob', async () => { const runner: ProcessRunner = { run: async (): Promise<CommandResult> => ({ file: 'ssh-keyscan', args: [], exitCode: 0, stdout: '127.0.0.1 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEp1bGlhbg==\n', stderr: '', durationMs: 1 }) }; const fingerprint = await scanHostFingerprint('127.0.0.1', 2222, runner); strictEqual(fingerprint.algorithm, 'ssh-ed25519'); match(fingerprint.fingerprint, /^SHA256:[A-Za-z0-9_-]+$/u); strictEqual(fingerprint.knownHostLine.startsWith('127.0.0.1 ssh-ed25519'), true); });
test('admin key generation is Ed25519, collision-safe and private', () => {
  const directory = mkdtempSync(join(tmpdir(), 'twilite-keys-'));
  const first = generateEd25519KeyPair(directory, 'test admin', new Date('2026-08-20T20:00:00Z'));
  const second = generateEd25519KeyPair(directory, 'test admin', new Date('2026-08-20T20:00:00Z'));
  ok(first.privateKeyPath !== second.privateKeyPath);
  const mode = statSync(first.privateKeyPath).mode & 0o777;
  ok(mode === 0o600 || mode === 0o400);
  match(readFileSync(first.publicKeyPath, 'utf8'), /^ssh-ed25519 /u);
  validatePrivateKeyPath(first.privateKeyPath);
});
test('hardening renders required SSH controls', () => { const plan = buildHardeningPlan({ sshMaxAuthTries: 3, sshIdleTimeoutMinutes: 15, sshMaxSessions: 3, allowAgentForwarding: false, allowTcpForwarding: false, allowX11Forwarding: false, passwordAuthentication: false, permitRootLogin: 'no' }, 5564); match(plan.config, /Port 5564/); match(plan.config, /MaxAuthTries 3/); match(plan.config, /MaxSessions 3/); match(plan.config, /AllowAgentForwarding no/); match(plan.config, /PermitRootLogin no/); match(renderSudoers('lumiadmin'), /lumiadmin ALL=\(ALL:ALL\) NOPASSWD:ALL/); match(renderAuthorizedKeys('ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEp1bGlhbg=='), /^ssh-ed25519 /u); });
function fakeTransport(name: string, log: string[], options: { readonly failInitialProbe?: boolean; readonly uid?: string } = {}): SshTransport {
  return { target: { ...target, user: name },
    async exec(command) {
      log.push(`${name}:exec:${command.join(' ')}`);
      if (options.failInitialProbe && command[0] === 'getent') throw new Error('not found');
      if (options.failInitialProbe && command.length >= 3 && command[0] === 'sudo' && command[1] === '-n' && command[2] === 'getent') throw new Error('not found');
      if (command[0] === 'id' && command[1] === '-u') return { file: 'ssh', args: command, exitCode: 0, stdout: options.uid ?? '0', stderr: '', durationMs: 1 };
      return { file: 'ssh', args: command, exitCode: 0, stdout: '', stderr: '', durationMs: 1 };
    },
    async writeAtomic(path, content, mode) { log.push(`${name}:write:${path}:${mode}:${content.length}`); return { file: 'ssh', args: [], exitCode: 0, stdout: '', stderr: '', durationMs: 1 }; },
    async closeControlMaster() { log.push(`${name}:close`); },
  };
}
test('bootstrap verifies admin access before port move and root disable', async () => {
  const log: string[] = [];
  const result = await bootstrapSsh({ initial: fakeTransport('root', log, { failInitialProbe: true }), adminAtInitialPort: fakeTransport('admin-old', log), adminAtFinalPort: fakeTransport('admin-new', log), adminUser: 'lumiadmin', publicKey: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEp1bGlhbg==', security: { sshMaxAuthTries: 3, sshIdleTimeoutMinutes: 15, sshMaxSessions: 3, allowAgentForwarding: false, allowTcpForwarding: false, allowX11Forwarding: false, passwordAuthentication: false, permitRootLogin: 'no' }, initialPort: 22, finalPort: 5564 });
  strictEqual(result.rootLoginDisabled, true);
  const transitionIndex = log.findIndex((entry) => entry === 'root:exec:sshd -t');
  const newAdminIndex = log.findIndex((entry) => entry === 'admin-new:exec:sudo -n true');
  ok(transitionIndex >= 0 && newAdminIndex > transitionIndex);
  const finalWrites = log.filter((entry) => entry.startsWith('admin-new:write:/etc/ssh/sshd_config.d/99-twilite-infra.conf'));
  strictEqual(finalWrites.length, 1);
});
test('non-root sudo bootstrap prefixes privileged commands with sudo', async () => {
  const log: string[] = [];
  const result = await bootstrapSsh({ initial: fakeTransport('vps', log, { failInitialProbe: true, uid: '1000' }), adminAtInitialPort: fakeTransport('admin-old', log), adminAtFinalPort: fakeTransport('admin-new', log), adminUser: 'lumiadmin', publicKey: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEp1bGlhbg==', security: { sshMaxAuthTries: 3, sshIdleTimeoutMinutes: 15, sshMaxSessions: 3, allowAgentForwarding: false, allowTcpForwarding: false, allowX11Forwarding: false, passwordAuthentication: false, permitRootLogin: 'no' }, initialPort: 22, finalPort: 5564, useSudo: true });
  strictEqual(result.rootLoginDisabled, true);
  ok(log.some((entry) => entry === 'vps:exec:sudo -n useradd --create-home --shell /bin/bash --groups sudo lumiadmin'));
  ok(log.some((entry) => entry === 'vps:exec:sudo -n sshd -t'));
  ok(log.some((entry) => entry === 'vps:exec:sudo -n systemctl reload ssh'));
  ok(log.some((entry) => entry === 'vps:exec:sudo -n chown root:root /etc/sudoers.d/90-lumiadmin'));
  ok(log.some((entry) => entry === 'admin-new:exec:sudo -n true'));
});
test('bootstrap without sudo still works for root initial user', async () => {
  const log: string[] = [];
  await bootstrapSsh({ initial: fakeTransport('root', log, { failInitialProbe: true, uid: '0' }), adminAtInitialPort: fakeTransport('admin-old', log), adminAtFinalPort: fakeTransport('admin-new', log), adminUser: 'lumiadmin', publicKey: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEp1bGlhbg==', security: { sshMaxAuthTries: 3, sshIdleTimeoutMinutes: 15, sshMaxSessions: 3, allowAgentForwarding: false, allowTcpForwarding: false, allowX11Forwarding: false, passwordAuthentication: false, permitRootLogin: 'no' }, initialPort: 22, finalPort: 5564, useSudo: false });
  ok(log.some((entry) => entry === 'root:exec:useradd --create-home --shell /bin/bash --groups sudo lumiadmin'));
  ok(!log.some((entry) => entry.includes('sudo -n useradd')));
});
