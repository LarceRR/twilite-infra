import { buildHardeningPlan, renderAuthorizedKeys, renderSudoers } from './hardening.ts';
import type { SshTransport } from './types.ts';
export interface BootstrapOptions { readonly initial: SshTransport; readonly adminAtInitialPort: SshTransport; readonly adminAtFinalPort: SshTransport; readonly adminUser: string; readonly publicKey: string; readonly security: Parameters<typeof buildHardeningPlan>[0]; readonly initialPort: number; readonly finalPort: number; readonly useSudo?: boolean; readonly onProgress?: (event: BootstrapEvent) => void; }
export type BootstrapEvent = { readonly step: 'initial-access-verified' } | { readonly step: 'admin-user-ready' } | { readonly step: 'admin-key-installed' } | { readonly step: 'sudoers-verified' } | { readonly step: 'admin-access-verified' } | { readonly step: 'ssh-transition-verified' } | { readonly step: 'ssh-final-verified' };
export interface BootstrapResult { readonly adminUser: string; readonly initialPort: number; readonly finalPort: number; readonly rootLoginDisabled: boolean; }
function priv(command: readonly string[], useSudo: boolean): readonly string[] { return useSudo ? ['sudo', '-n', ...command] : command; }
export async function bootstrapSsh(options: BootstrapOptions): Promise<BootstrapResult> {
  assertUser(options.adminUser);
  if (options.initialPort === options.finalPort) throw new Error('initial and final SSH ports must differ during bootstrap');
  const sudo = options.useSudo ?? false;
  await options.initial.exec(['id', '-u']);
  options.onProgress?.({ step: 'initial-access-verified' });
  const passwdProbe = await probe(options.initial, priv(['getent', 'passwd', options.adminUser], sudo));
  if (!passwdProbe) await options.initial.exec(priv(['useradd', '--create-home', '--shell', '/bin/bash', '--groups', 'sudo', options.adminUser], sudo));
  await options.initial.exec(priv(['install', '-d', '-m', '700', '-o', options.adminUser, '-g', options.adminUser, `/home/${options.adminUser}/.ssh`], sudo));
  options.onProgress?.({ step: 'admin-user-ready' });
  const publicKey = renderAuthorizedKeys(options.publicKey).trim();
  if (options.initial.appendLineIfMissing !== undefined) await options.initial.appendLineIfMissing(`/home/${options.adminUser}/.ssh/authorized_keys`, publicKey, 0o600);
  else await options.initial.writeAtomic(`/home/${options.adminUser}/.ssh/authorized_keys`, `${publicKey}\n`, 0o600);
  await options.initial.exec(priv(['chown', `${options.adminUser}:${options.adminUser}`, `/home/${options.adminUser}/.ssh/authorized_keys`], sudo));
  options.onProgress?.({ step: 'admin-key-installed' });
  const sudoersPath = `/etc/sudoers.d/90-${options.adminUser}`;
  await options.initial.writeAtomic(sudoersPath, renderSudoers(options.adminUser), 0o440);
  await options.initial.exec(priv(['chown', 'root:root', sudoersPath], sudo));
  await options.initial.exec(priv(['chmod', '0440', sudoersPath], sudo));
  await options.initial.exec(priv(['visudo', '-cf', sudoersPath], sudo));
  options.onProgress?.({ step: 'sudoers-verified' });
  await options.adminAtInitialPort.exec(['sudo', '-n', 'true']);
  options.onProgress?.({ step: 'admin-access-verified' });
  const transition = buildHardeningPlan({ ...options.security, permitRootLogin: 'prohibit-password' as const }, options.finalPort);
  await writeAndReload(options.initial, transition, sudo);
  await options.adminAtFinalPort.exec(['sudo', '-n', 'true']);
  options.onProgress?.({ step: 'ssh-transition-verified' });
  const final = buildHardeningPlan({ ...options.security, permitRootLogin: 'no' as const }, options.finalPort);
  await writeAndReload(options.adminAtFinalPort, final, false);
  await options.adminAtFinalPort.exec(['id', '-u']);
  options.onProgress?.({ step: 'ssh-final-verified' });
  return { adminUser: options.adminUser, initialPort: options.initialPort, finalPort: options.finalPort, rootLoginDisabled: true };
}
async function writeAndReload(transport: SshTransport, plan: ReturnType<typeof buildHardeningPlan>, useSudo: boolean): Promise<void> { await transport.writeAtomic(plan.sshdDropInPath, plan.config, 0o644); if (useSudo) { await transport.exec(['sudo', '-n', 'chown', 'root:root', plan.sshdDropInPath]); await transport.exec(['sudo', '-n', 'chmod', '0644', plan.sshdDropInPath]); } await transport.exec(priv(['sshd', '-t'], useSudo)); await transport.exec(priv(['systemctl', 'reload', 'ssh'], useSudo)); }
async function probe(transport: SshTransport, command: readonly string[]): Promise<boolean> { try { await transport.exec(command); return true; } catch { return false; } }
function assertUser(user: string): void { if (!/^[a-z_][a-z0-9_-]{0,31}$/u.test(user)) throw new Error('admin user is not a safe POSIX username'); }
