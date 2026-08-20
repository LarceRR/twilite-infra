export type VmBackendName = 'qemu' | 'incus';
export type VmAcceleration = 'kvm' | 'tcg';
export type VmStatus = 'absent' | 'stopped' | 'running' | 'unknown';

export interface VmProfile {
  readonly name: string;
  readonly memoryMiB: number;
  readonly cpus: number;
  readonly diskGiB: number;
  readonly sshHostPort: number;
  readonly sshGuestPort: number;
  readonly architecture: 'x86_64' | 'arm64';
}

export interface VmPaths {
  readonly root: string;
  readonly disk: string;
  readonly seedDir: string;
  readonly serialLog: string;
  readonly sshLog: string;
  readonly knownHosts: string;
  readonly privateKey: string;
}

export interface VmPreflight {
  readonly backend: VmBackendName;
  readonly acceleration: VmAcceleration;
  readonly wsl2: boolean;
  readonly kvm: boolean;
  readonly qemu: boolean;
  readonly ssh: boolean;
  readonly degraded: boolean;
  readonly failures: readonly string[];
}

export interface VmCommand {
  readonly file: string;
  readonly args: readonly string[];
}

export interface VmBackend {
  readonly name: VmBackendName;
  preflight(): Promise<VmPreflight>;
  status(profile: VmProfile, paths: VmPaths): Promise<VmStatus>;
  create(profile: VmProfile, paths: VmPaths): Promise<void>;
  start(profile: VmProfile, paths: VmPaths): Promise<void>;
  stop(profile: VmProfile, paths: VmPaths): Promise<void>;
  reboot(profile: VmProfile, paths: VmPaths): Promise<void>;
  destroy(profile: VmProfile, paths: VmPaths): Promise<void>;
  reset(profile: VmProfile, paths: VmPaths): Promise<void>;
}
