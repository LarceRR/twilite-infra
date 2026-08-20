import type { SshTarget, SshTransportOptions } from './types.ts';
import { assertSafeSshToken } from './util.ts';

export function buildSshArgs(target: SshTarget, command: readonly string[], options: SshTransportOptions = {}): readonly string[] {
  assertSafeSshToken(target.host, 'host');
  assertSafeSshToken(target.user, 'user');
  assertSafeSshToken(target.identityFile, 'identityFile');
  assertSafeSshToken(target.knownHostsFile, 'knownHostsFile');
  assertSafeSshToken(target.controlPath, 'controlPath');
  const connectTimeout = options.connectTimeoutSeconds ?? 10;
  const aliveInterval = options.serverAliveIntervalSeconds ?? 15;
  const aliveCount = options.serverAliveCountMax ?? 3;
  if (!Number.isInteger(target.port) || target.port < 1 || target.port > 65535) throw new Error('SSH port must be 1..65535');
  const args: string[] = [
    '-p', String(target.port),
    '-i', target.identityFile,
    '-o', 'BatchMode=yes',
    '-o', 'StrictHostKeyChecking=yes',
    '-o', `UserKnownHostsFile=${target.knownHostsFile}`,
    '-o', 'ControlMaster=auto',
    '-o', 'ControlPersist=60',
    '-o', `ControlPath=${target.controlPath}`,
    '-o', `ConnectTimeout=${connectTimeout}`,
    '-o', `ServerAliveInterval=${aliveInterval}`,
    '-o', `ServerAliveCountMax=${aliveCount}`,
    `${target.user}@${target.host}`,
  ];
  return [...args, ...command];
}

export function buildControlCloseArgs(target: SshTarget, options: SshTransportOptions = {}): readonly string[] {
  return buildSshArgs(target, ['-O', 'exit'], options);
}

export function buildKeyscanArgs(host: string, port: number, timeoutSeconds = 10): readonly string[] {
  assertSafeSshToken(host, 'host');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('SSH port must be 1..65535');
  return ['-T', String(timeoutSeconds), '-p', String(port), '-t', 'ed25519,ecdsa,rsa', host];
}
