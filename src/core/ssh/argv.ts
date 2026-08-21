import type { SshTarget, SshTransportOptions } from './types.ts';
import { assertSafeSshToken } from './util.ts';

function commonOptions(target: SshTarget, options: SshTransportOptions): string[] {
  assertSafeSshToken(target.host, 'host');
  assertSafeSshToken(target.user, 'user');
  assertSafeSshToken(target.identityFile, 'identityFile');
  assertSafeSshToken(target.knownHostsFile, 'knownHostsFile');
  assertSafeSshToken(target.controlPath, 'controlPath');
  if (!Number.isInteger(target.port) || target.port < 1 || target.port > 65535) throw new Error('SSH port must be 1..65535');
  return [
    '-p', String(target.port), '-i', target.identityFile,
    '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes',
    '-o', `UserKnownHostsFile=${target.knownHostsFile}`,
    '-o', 'ControlMaster=auto', '-o', 'ControlPersist=60',
    '-o', `ControlPath=${target.controlPath}`,
    '-o', `ConnectTimeout=${options.connectTimeoutSeconds ?? 10}`,
    '-o', `ServerAliveInterval=${options.serverAliveIntervalSeconds ?? 15}`,
    '-o', `ServerAliveCountMax=${options.serverAliveCountMax ?? 3}`,
  ];
}

export function buildSshArgs(target: SshTarget, command: readonly string[], options: SshTransportOptions = {}): readonly string[] {
  return [...commonOptions(target, options), `${target.user}@${target.host}`, ...command];
}

export function buildControlCloseArgs(target: SshTarget, options: SshTransportOptions = {}): readonly string[] {
  return [...commonOptions(target, options), '-O', 'exit', `${target.user}@${target.host}`];
}

export function buildKeyscanArgs(host: string, port: number, timeoutSeconds = 10): readonly string[] {
  assertSafeSshToken(host, 'host');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('SSH port must be 1..65535');
  return ['-T', String(timeoutSeconds), '-p', String(port), '-t', 'ed25519,ecdsa,rsa', host];
}
