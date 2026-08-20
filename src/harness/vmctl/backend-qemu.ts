import { mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import type { VmBackend, VmPaths, VmPreflight, VmProfile, VmStatus } from './types.ts';
import { detectPreflight } from './preflight.ts';
import { qemuCommand } from './commands.ts';

function run(file: string, args: readonly string[], logPath?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(file, [...args], { stdio: logPath === undefined ? 'inherit' : ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout?.on('data', (chunk: Buffer) => { output += chunk.toString(); });
    child.stderr?.on('data', (chunk: Buffer) => { output += chunk.toString(); });
    child.on('error', reject);
    child.on('close', (code) => { if (code === 0) resolve(); else reject(new Error(`${file} exited ${code}: ${output.slice(-4000)}`)); });
  });
}

function pid(paths: VmPaths): number | undefined {
  try { const value = Number.parseInt(readFileSync(`${paths.root}/qemu.pid`, 'utf8').trim(), 10); return Number.isInteger(value) ? value : undefined; } catch { return undefined; }
}

export function createQemuBackend(): VmBackend {
  const backend: VmBackend = {
    name: 'qemu',
    async preflight(): Promise<VmPreflight> { return detectPreflight('qemu'); },
    async status(_profile, paths): Promise<VmStatus> {
      const processId = pid(paths);
      if (processId === undefined) return existsSync(paths.disk) ? 'stopped' : 'absent';
      try { process.kill(processId, 0); return 'running'; } catch { return 'stopped'; }
    },
    async create(profile, paths): Promise<void> {
      mkdirSync(paths.root, { recursive: true });
      mkdirSync(paths.seedDir, { recursive: true });
      if (!existsSync(paths.disk)) await run('qemu-img', ['create', '-f', 'qcow2', paths.disk, `${profile.diskGiB}G`]);
    },
    async start(profile, paths): Promise<void> {
      const check = detectPreflight('qemu');
      if (!check.qemu) throw new Error('qemu-system-x86_64 is required');
      await run(...Object.values(qemuCommand(profile, paths, check.acceleration)) as [string, readonly string[]]);
    },
    async stop(_profile, paths): Promise<void> {
      const processId = pid(paths);
      if (processId !== undefined) { try { process.kill(processId, 'SIGTERM'); } catch { /* already stopped */ } }
    },
    async reboot(_profile, paths): Promise<void> {
      const processId = pid(paths);
      if (processId === undefined) throw new Error('VM is not running');
      process.kill(processId, 'SIGHUP');
    },
    async destroy(_profile, paths): Promise<void> { await backend.stop(_profile, paths); rmSync(paths.root, { recursive: true, force: true }); },
    async reset(profile, paths): Promise<void> { await backend.destroy(profile, paths); await backend.create(profile, paths); },
  };
  return backend;
}
