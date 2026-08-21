import { spawn } from 'node:child_process';
import { monotonicNow } from './util.ts';
import { transient, permanent, cancelled, type InfraError } from '../errors.ts';
import type { CommandResult, CommandSpec, ProcessRunner } from './types.ts';

export function createProcessRunner(): ProcessRunner {
  return { run: runProcess };
}

export function runProcess(spec: CommandSpec): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const started = monotonicNow();
    const child = spawn(spec.file, [...spec.args], { stdio: ['pipe', 'pipe', 'pipe'], shell: false });
    let stdout = '';
    let stderr = '';
    let settled = false;
    const finish = (callback: () => void): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      spec.signal?.removeEventListener('abort', onAbort);
      callback();
    };
    const onAbort = (): void => {
      child.kill('SIGTERM');
      finish(() => reject(cancelled(`command ${spec.file} cancelled`)));
    };
    const timeoutMs = spec.timeoutMs ?? 120_000;
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      finish(() => reject(transient('E_PROCESS_TIMEOUT', `${spec.file} timed out after ${timeoutMs}ms`)));
    }, timeoutMs);
    child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString('utf8'); });
    child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString('utf8'); });
    child.once('error', (error: NodeJS.ErrnoException) => {
      const infra = error.code === 'ENOENT'
        ? permanent('E_EXEC_NOT_FOUND', `executable not found: ${spec.file}`, { cause: error })
        : transient('E_EXEC_FAILED', `failed to start ${spec.file}`, { cause: error });
      finish(() => reject(infra));
    });
    child.once('close', (exitCode) => {
      finish(() => {
        const result: CommandResult = { file: spec.file, args: spec.args, exitCode: exitCode ?? 255, stdout, stderr, durationMs: monotonicNow() - started };
        if (result.exitCode !== 0) reject(classifyExit(result));
        else resolve(result);
      });
    });
    spec.signal?.addEventListener('abort', onAbort, { once: true });
    if (spec.stdin !== undefined) child.stdin.end(spec.stdin);
    else child.stdin.end();
  });
}

function classifyExit(result: CommandResult): InfraError {
  const text = `${result.stderr}\n${result.stdout}`;
  const transientHint = /connection (?:refused|reset)|timed out|temporarily unavailable|resource busy|could not resolve/i.test(text);
  return transientHint
    ? transient('E_REMOTE_COMMAND', `${result.file} exited ${result.exitCode}`, { details: { exitCode: result.exitCode } })
    : permanent('E_REMOTE_COMMAND', `${result.file} exited ${result.exitCode}`, { details: { exitCode: result.exitCode } });
}
