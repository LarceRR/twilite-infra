import { createProcessRunner } from './process.ts';
import { buildControlCloseArgs, buildSshArgs } from './argv.ts';
import type { CommandResult, ProcessRunner, SshTarget, SshTransport, SshTransportOptions } from './types.ts';

const ATOMIC_WRITE_SCRIPT = `set -eu
path=$1
mode=$2
dir=$(dirname -- "$path")
tmp=$(mktemp "$dir/.twilite-write.XXXXXX")
cleanup() { rm -f -- "$tmp"; }
trap cleanup EXIT
umask 077
cat >"$tmp"
chmod -- "$mode" "$tmp"
sync -f "$tmp"
mv -f -- "$tmp" "$path"
sync -f "$dir"
trap - EXIT
`;

export function createSshTransport(target: SshTarget, options: SshTransportOptions = {}, runner: ProcessRunner = createProcessRunner()): SshTransport {
  return {
    target,
    async exec(command, callOptions = {}): Promise<CommandResult> {
      return runner.run({ file: 'ssh', args: buildSshArgs(target, command, options), timeoutMs: callOptions.timeoutMs ?? options.commandTimeoutMs, signal: callOptions.signal });
    },
    async writeAtomic(remotePath, content, mode = 0o600, callOptions = {}): Promise<CommandResult> {
      if (!remotePath.startsWith('/') || remotePath.includes('') || remotePath.includes('\n')) throw new Error('remotePath must be an absolute single-line path');
      if (!Number.isInteger(mode) || mode < 0 || mode > 0o777) throw new Error('remote file mode is invalid');
      return runner.run({ file: 'ssh', args: buildSshArgs(target, ['sh', '-s', '--', remotePath, `0${mode.toString(8)}`], options), stdin: ATOMIC_WRITE_SCRIPT + content, timeoutMs: callOptions.timeoutMs ?? options.commandTimeoutMs, signal: callOptions.signal });
    },
    async closeControlMaster(): Promise<void> {
      await runner.run({ file: 'ssh', args: buildControlCloseArgs(target, options), timeoutMs: options.commandTimeoutMs });
    },
  };
}

export { ATOMIC_WRITE_SCRIPT };
