import { deepStrictEqual, strictEqual } from 'node:assert/strict';
import { test } from 'node:test';
import { getProfile, pathsFor } from '../../src/harness/vmctl/profiles.ts';
import { qemuCommand, safeQemuStopCommand } from '../../src/harness/vmctl/commands.ts';

test('vps-2gb profile is the production-like 2 GiB VM', () => {
  const profile = getProfile('vps-2gb');
  strictEqual(profile.memoryMiB, 2048);
  strictEqual(profile.cpus, 2);
  const paths = pathsFor('.vm', profile);
  const command = qemuCommand(profile, paths, 'kvm');
  strictEqual(command.file, 'qemu-system-x86_64');
  strictEqual(command.args.includes('-enable-kvm'), true);
  strictEqual(command.args.some((arg) => arg.includes('hostfwd=tcp:127.0.0.1:2222')), true);
});

test('VM process control uses argv, not shell command concatenation', () => {
  deepStrictEqual(safeQemuStopCommand(1234), { file: 'kill', args: ['-TERM', '1234'] });
});
