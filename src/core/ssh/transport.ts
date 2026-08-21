import { createProcessRunner } from './process.ts';
import { buildControlCloseArgs, buildSshArgs } from './argv.ts';
import type { ProcessRunner, SshTarget, SshTransport, SshTransportOptions } from './types.ts';
const ATOMIC_WRITE_SCRIPT = `set -eu
path=$1
mode=$2
dir=$(dirname -- "$path")
tmp=''
cleanup() { if [ -n "$tmp" ]; then rm -f -- "$tmp"; fi; }
trap cleanup EXIT
umask 077
install -d -m 0755 -- "$dir"
tmp=$(mktemp "$dir/.twilite-write.XXXXXX")
cat >"$tmp"
chmod -- "$mode" "$tmp"
sync -f "$tmp"
mv -f -- "$tmp" "$path"
sync -f "$dir"
trap - EXIT
`;
const APPEND_LINE_SCRIPT = `set -eu
path=$1
mode=$2
dir=$(dirname -- "$path")
install -d -m 0755 -- "$dir"
tmp=$(mktemp)
cleanup() { rm -f -- "$tmp"; }
trap cleanup EXIT
cat >"$tmp"
touch -- "$path"
chmod -- "$mode" "$path"
if ! grep -Fqx -- "$(cat "$tmp")" "$path"; then
  cat "$tmp" >> "$path"
fi
chmod -- "$mode" "$path"
sync -f "$path"
sync -f "$dir"
`;
export function createSshTransport(target: SshTarget, options: SshTransportOptions = {}, runner: ProcessRunner = createProcessRunner()): SshTransport { return { target, async exec(command, callOptions = {}) { return runner.run({ file: 'ssh', args: buildSshArgs(target, command, options), ...(callOptions.timeoutMs === undefined ? {} : { timeoutMs: callOptions.timeoutMs }), ...(callOptions.signal === undefined ? {} : { signal: callOptions.signal }) }); }, async writeAtomic(remotePath, content, mode = 0o600, callOptions = {}) { assertRemotePath(remotePath); assertMode(mode); return runner.run({ file: 'ssh', args: buildSshArgs(target, ['sh', '-s', '--', remotePath, `0${mode.toString(8)}`], options), stdin: ATOMIC_WRITE_SCRIPT + content, ...(callOptions.timeoutMs === undefined ? {} : { timeoutMs: callOptions.timeoutMs }), ...(callOptions.signal === undefined ? {} : { signal: callOptions.signal }) }); }, async appendLineIfMissing(remotePath, line, mode = 0o600, callOptions = {}) { assertRemotePath(remotePath); assertMode(mode); if (line.includes('\n') || line.includes('\r')) throw new Error('authorized key must be a single line'); return runner.run({ file: 'ssh', args: buildSshArgs(target, ['sh', '-s', '--', remotePath, `0${mode.toString(8)}`], options), stdin: APPEND_LINE_SCRIPT + line, ...(callOptions.timeoutMs === undefined ? {} : { timeoutMs: callOptions.timeoutMs }), ...(callOptions.signal === undefined ? {} : { signal: callOptions.signal }) }); }, async closeControlMaster() { await runner.run({ file: 'ssh', args: buildControlCloseArgs(target, options), ...(options.commandTimeoutMs === undefined ? {} : { timeoutMs: options.commandTimeoutMs }) }); } }; }
function assertRemotePath(path: string): void { if (!path.startsWith('/') || path.includes(String.fromCharCode(0)) || path.includes('\n')) throw new Error('remotePath must be an absolute single-line path'); }
function assertMode(mode: number): void { if (!Number.isInteger(mode) || mode < 0 || mode > 0o777) throw new Error('remote file mode is invalid'); }
export { ATOMIC_WRITE_SCRIPT, APPEND_LINE_SCRIPT };
