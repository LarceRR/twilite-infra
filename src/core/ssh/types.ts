import type { InfraError } from '../errors.ts';

export interface SshTarget {
  readonly host: string;
  readonly port: number;
  readonly user: string;
  readonly identityFile: string;
  readonly knownHostsFile: string;
  readonly controlPath: string;
}

export interface SshTransportOptions {
  readonly connectTimeoutSeconds?: number;
  readonly commandTimeoutMs?: number;
  readonly serverAliveIntervalSeconds?: number;
  readonly serverAliveCountMax?: number;
}

export interface CommandSpec {
  readonly file: string;
  readonly args: readonly string[];
  readonly stdin?: string;
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
}

export interface CommandResult {
  readonly file: string;
  readonly args: readonly string[];
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly durationMs: number;
}

export interface ProcessRunner {
  run(spec: CommandSpec): Promise<CommandResult>;
}

export interface SshTransport {
  readonly target: SshTarget;
  exec(command: readonly string[], options?: { readonly timeoutMs?: number; readonly signal?: AbortSignal }): Promise<CommandResult>;
  writeAtomic(remotePath: string, content: string, mode?: number, options?: { readonly timeoutMs?: number; readonly signal?: AbortSignal }): Promise<CommandResult>;
  closeControlMaster(): Promise<void>;
}

export interface SshFailure {
  readonly error: InfraError;
  readonly command: CommandSpec;
}
