import type { VmProfile, VmPaths } from './types.ts';

export const VM_PROFILES: Readonly<Record<string, VmProfile>> = {
  'vps-2gb': { name: 'vps-2gb', memoryMiB: 2048, cpus: 2, diskGiB: 20, sshHostPort: 2222, sshGuestPort: 22, architecture: 'x86_64' },
  'vps-8gb': { name: 'vps-8gb', memoryMiB: 8192, cpus: 4, diskGiB: 40, sshHostPort: 2223, sshGuestPort: 22, architecture: 'x86_64' },
};

export function getProfile(name: string): VmProfile {
  const profile = VM_PROFILES[name];
  if (profile === undefined) throw new Error(`unknown VM profile: ${name}`);
  return profile;
}

export function pathsFor(root: string, profile: VmProfile): VmPaths {
  const dir = `${root}/${profile.name}`;
  return {
    root: dir,
    disk: `${dir}/disk.qcow2`,
    seedDir: `${dir}/seed`,
    serialLog: `${dir}/serial.log`,
    sshLog: `${dir}/ssh.log`,
    knownHosts: `${dir}/known_hosts`,
    privateKey: `${dir}/id_ed25519`,
  };
}
