#!/usr/bin/env node
import { getProfile, pathsFor } from './profiles.ts';
import { createQemuBackend } from './backend-qemu.ts';
import { detectPreflight } from './preflight.ts';
import type { VmBackend } from './types.ts';

const backend: VmBackend = createQemuBackend();
const root = process.env['TWILITE_VM_ROOT'] ?? '.vm';
const profileName = process.env['PROFILE'] ?? 'vps-2gb';
const profile = getProfile(profileName);
const paths = pathsFor(root, profile);
const command = process.argv[2] ?? 'doctor';

async function main(): Promise<void> {
  if (command === 'doctor') { console.log(JSON.stringify(detectPreflight('qemu'), null, 2)); return; }
  if (command === 'create' || command === 'reset') { await backend[command](profile, paths); console.log(`VM ${command}d: ${profile.name}`); return; }
  if (command === 'start' || command === 'stop' || command === 'reboot' || command === 'destroy') { await backend[command](profile, paths); console.log(`VM ${command}: ${profile.name}`); return; }
  if (command === 'status') { console.log(await backend.status(profile, paths)); return; }
  throw new Error(`unknown vmctl command: ${command}`);
}

const direct = process.argv[1] !== undefined && import.meta.filename === process.argv[1];
if (direct) main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
