import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';
import type { VmPaths } from './types.ts';
export function ensureSshKey(paths: VmPaths): string { mkdirSync(dirname(paths.privateKey), { recursive: true }); if (!existsSync(paths.privateKey)) execFileSync('ssh-keygen', ['-t', 'ed25519', '-N', '', '-f', paths.privateKey], { stdio: 'ignore' }); return `${paths.privateKey}.pub`; }
export function writeCloudInit(paths: VmPaths, publicKeyPath: string): void { mkdirSync(paths.seedDir, { recursive: true }); const publicKey = readPublicKey(publicKeyPath); writeFileSync(`${paths.seedDir}/user-data`, `#cloud-config\ndisable_root: false\nssh_pwauth: false\nusers:\n  - default\n  - name: root\n    lock_passwd: false\n    shell: /bin/bash\n    ssh_authorized_keys:\n      - ${publicKey}\n  - name: ubuntu\n    groups: [adm, sudo, docker]\n    sudo: ALL=(ALL) NOPASSWD:ALL\n    shell: /bin/bash\n    ssh_authorized_keys:\n      - ${publicKey}\n`, { mode: 0o600 }); writeFileSync(`${paths.seedDir}/meta-data`, `instance-id: twilite-${basename(paths.root)}\nlocal-hostname: twilite-${basename(paths.root)}\n`, { mode: 0o600 }); }
function readPublicKey(path: string): string { const key = readFileSync(path, 'utf8').trim(); if (!/^ssh-ed25519 [A-Za-z0-9+/=]+(?: .*)?$/.test(key)) throw new Error('generated SSH public key is not Ed25519'); return key; }
function basename(path: string): string { return path.split('/').filter(Boolean).at(-1) ?? 'vm'; }
