import type { VmCommand, VmProfile, VmPaths } from './types.ts';

/** Every process call is argv-based. No VM input is interpolated into a shell string. */
export function qemuCommand(profile: VmProfile, paths: VmPaths, acceleration: 'kvm' | 'tcg'): VmCommand {
  const accel = acceleration === 'kvm' ? ['-enable-kvm', '-machine', 'accel=kvm'] : ['-machine', 'accel=tcg,thread=multi'];
  return {
    file: 'qemu-system-x86_64',
    args: [
      '-name', profile.name,
      '-m', String(profile.memoryMiB),
      '-smp', String(profile.cpus),
      ...accel,
      '-drive', `file=${paths.disk},if=virtio,format=qcow2,cache=writeback`,
      '-netdev', `user,id=n1,hostfwd=tcp:127.0.0.1:${profile.sshHostPort}-:22`,
      '-device', 'virtio-net-pci,netdev=n1',
      '-nographic',
      '-serial', `file:${paths.serialLog}`,
      '-pidfile', `${paths.root}/qemu.pid`,
      '-daemonize',
    ],
  };
}

export function safeQemuStopCommand(pid: number): VmCommand {
  if (!Number.isSafeInteger(pid) || pid <= 0) throw new Error('invalid VM process id');
  return { file: 'kill', args: ['-TERM', String(pid)] };
}
