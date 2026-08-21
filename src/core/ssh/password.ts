import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { buildPasswordControlMasterArgs } from './argv.ts';
import type { ProcessRunner, SshTarget, SshTransport } from './types.ts';
import { createSshTransport } from './transport.ts';
import { createProcessRunner } from './process.ts';

export type InitialAuthMode = 'key' | 'password' | 'auto';

export interface PasswordBootstrapOptions {
  readonly target: SshTarget;
  readonly runner?: ProcessRunner;
  readonly timeoutMs?: number;
}

/**
 * Starts an OpenSSH ControlMaster which asks for the password on the operator's TTY.
 * Node never receives, stores, logs or passes the password as an argument or environment value.
 */
export async function startInteractivePasswordControlMaster(options: PasswordBootstrapOptions): Promise<SshTransport> {
  if (process.stdin.isTTY !== true || process.stdout.isTTY !== true) {
    throw new Error('password bootstrap requires an interactive TTY; use key bootstrap or a documented secure provider in non-interactive mode');
  }
  mkdirSync(dirname(options.target.controlPath), { recursive: true, mode: 0o700 });
  const args = buildPasswordControlMasterArgs(options.target);
  await runInteractiveSsh(args, options.timeoutMs ?? 120_000);
  return createSshTransport(options.target, { commandTimeoutMs: options.timeoutMs ?? 120_000 }, options.runner ?? createProcessRunner());
}

function runInteractiveSsh(args: readonly string[], timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('ssh', [...args], { stdio: 'inherit', shell: false });
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('interactive initial SSH authentication timed out; verify provider access'));
    }, timeoutMs);
    child.once('error', (error) => { clearTimeout(timer); reject(new Error(`initial SSH authentication could not start: ${error.message}`)); });
    child.once('close', (code) => { clearTimeout(timer); if (code === 0) resolve(); else reject(new Error('initial SSH authentication failed; verify the provider username/password and SSH service')); });
  });
}
