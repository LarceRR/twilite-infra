#!/usr/bin/env node
import { getProfile, pathsFor } from './profiles.ts';
import { createQemuBackend } from './backend-qemu.ts';
import type { VmBackend } from './types.ts';
const backend: VmBackend = createQemuBackend();
const root = process.env['TWILITE_VM_ROOT'] ?? '.vm';
const profileName = process.env['PROFILE'] ?? 'vps-2gb';
const profile = getProfile(profileName);
const paths = pathsFor(root, profile);
const command = process.argv[2] ?? 'doctor';
async function main(): Promise<void> { switch (command) { case 'doctor': console.log(JSON.stringify(await backend.preflight(), null, 2)); return; case 'create': await backend.create(profile, paths); console.log(`VM created: ${profile.name}`); return; case 'reset': await backend.reset(profile, paths); console.log(`VM reset: ${profile.name}`); return; case 'start': await backend.start(profile, paths); console.log(`VM started: ${profile.name}`); return; case 'stop': await backend.stop(profile, paths); console.log(`VM stopped: ${profile.name}`); return; case 'reboot': await backend.reboot(profile, paths); console.log(`VM reboot requested: ${profile.name}`); return; case 'destroy': await backend.destroy(profile, paths); console.log(`VM destroyed: ${profile.name}`); return; case 'status': console.log(await backend.status(profile, paths)); return; default: throw new Error(`unknown vmctl command: ${command}`); } }
const direct = process.argv[1] !== undefined && import.meta.filename === process.argv[1];
if (direct) main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
