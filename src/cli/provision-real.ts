import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createSshTransport } from '../core/ssh/transport.ts';
import { controlPathFor } from '../core/ssh/util.ts';
import { scanHostFingerprint, trustHostFingerprint } from '../core/ssh/fingerprint.ts';
import { generateEd25519KeyPair, validatePrivateKeyPath } from '../core/ssh/keys.ts';
import { bootstrapSsh } from '../core/ssh/bootstrap.ts';
import { buildBaselinePlan } from '../core/security/baseline.ts';
import { createProcessRunner } from '../core/ssh/process.ts';
import type { ProvisionConfig } from '../core/config/schema.ts';
import type { SshTarget, SshTransport } from '../core/ssh/types.ts';
import type { Logger } from '../core/logging/logger.ts';

export interface RealProvisionOptions { readonly config: ProvisionConfig; readonly repoRoot: string; readonly logger: Logger; readonly signal?: AbortSignal; }

/** Executes the real SSH/bootstrap + OS baseline path on one Linux host. */
export async function provisionRealHost(options: RealProvisionOptions): Promise<void> {
  const { config, repoRoot, logger, signal } = options;
  if (process.platform !== 'linux') throw new Error('real provisioning must run inside Linux/WSL2, not native Windows');
  const target = config.target;
  const identityFile = target.identityPath;
  const knownHostsFile = target.knownHostsPath ?? resolve(target.keyDirectory, 'known_hosts');
  if (identityFile === undefined) throw new Error('target.identityPath is required for real provisioning');
  validatePrivateKeyPath(identityFile);
  const fingerprint = await scanHostFingerprint(target.host, target.initialSshPort);
  logger.log('INFO', 'ssh.host_fingerprint', { host: target.host, port: target.initialSshPort, fingerprint: fingerprint.fingerprint });
  if (process.env['TWILITE_ACCEPT_HOST_KEY'] !== '1') throw new Error('host fingerprint not accepted; set TWILITE_ACCEPT_HOST_KEY=1 only for the disposable test VM');
  trustHostFingerprint(knownHostsFile, fingerprint);

  const keyPair = generateEd25519KeyPair(resolve(target.keyDirectory), config.label);
  const initial = createTransport({ host: target.host, port: target.initialSshPort, user: target.initialUser, identityFile, knownHostsFile });
  const adminOld = createTransport({ host: target.host, port: target.initialSshPort, user: target.adminUser, identityFile: keyPair.privateKeyPath, knownHostsFile });
  const adminNew = createTransport({ host: target.host, port: target.finalSshPort, user: target.adminUser, identityFile: keyPair.privateKeyPath, knownHostsFile });

  await verifyRemotePreflight(initial, config);
  logger.log('INFO', 'phase.preflight.success', { host: target.host });
  await bootstrapSsh({ initial, adminAtInitialPort: adminOld, adminAtFinalPort: adminNew, adminUser: target.adminUser, publicKey: readFileSync(keyPair.publicKeyPath, 'utf8'), security: config.security, initialPort: target.initialSshPort, finalPort: target.finalSshPort });
  logger.log('INFO', 'phase.ssh_baseline.success', { adminUser: target.adminUser, sshPort: target.finalSshPort });

  const plan = buildBaselinePlan(config, target.hostnameOverride ?? config.label);
  await applyBaseline(adminNew, plan, repoRoot, signal, logger);
  logger.log('INFO', 'phase.os_security.success', { files: plan.files.length, publicPorts: plan.publicPorts });
  await adminNew.exec(['sudo', 'bash', '/usr/local/sbin/twilite-verify-baseline'], { signal });
  logger.log('INFO', 'phase.ready.success', { host: target.host });
}

function createTransport(input: { readonly host: string; readonly port: number; readonly user: string; readonly identityFile: string; readonly knownHostsFile: string }): SshTransport {
  const target: SshTarget = { ...input, controlPath: controlPathFor(input) };
  return createSshTransport(target, { commandTimeoutMs: 300_000 }, createProcessRunner());
}

async function verifyRemotePreflight(transport: SshTransport, config: ProvisionConfig): Promise<void> {
  const identity = await transport.exec(['id', '-u'], { timeoutMs: config.behavior.stepTimeoutMs });
  if (identity.stdout.trim() !== '0') throw new Error('initial SSH identity is not root');
  const os = await transport.exec(['cat', '/etc/os-release'], { timeoutMs: config.behavior.stepTimeoutMs });
  if (!/^ID=ubuntu$/m.test(os.stdout)) throw new Error('target OS is not Ubuntu');
  await transport.exec(['uname', '-m'], { timeoutMs: config.behavior.stepTimeoutMs });
  await transport.exec(['test', '-r', '/proc/meminfo'], { timeoutMs: config.behavior.stepTimeoutMs });
  await transport.exec(['test', '-w', '/tmp'], { timeoutMs: config.behavior.stepTimeoutMs });
}

async function applyBaseline(transport: SshTransport, plan: ReturnType<typeof buildBaselinePlan>, repoRoot: string, signal: AbortSignal | undefined, logger: Logger): Promise<void> {
  for (const file of plan.files) {
    await transport.writeAtomic(file.path, file.content, file.mode, { signal });
    logger.log('INFO', 'baseline.file_written', { path: file.path, mode: file.mode });
  }
  const installScript = readFileSync(resolve(repoRoot, 'infra/host/hardening/install-packages.sh'), 'utf8');
  const dockerScript = readFileSync(resolve(repoRoot, 'infra/host/docker/install-docker.sh'), 'utf8');
  await transport.writeAtomic('/tmp/twilite-install-packages.sh', installScript, 0o700, { signal });
  await transport.writeAtomic('/tmp/twilite-install-docker.sh', dockerScript, 0o700, { signal });
  await transport.exec(['sudo', 'bash', '/tmp/twilite-install-packages.sh'], { signal, timeoutMs: 900_000 });
  await transport.exec(['sudo', 'bash', '/tmp/twilite-install-docker.sh'], { signal, timeoutMs: 900_000 });
  const publicPorts = plan.publicPorts.filter((port) => port !== plan.sshPort).join(' ');
  await transport.exec(['sudo', 'env', `TWILITE_SSH_PORT=${plan.sshPort}`, `TWILITE_PUBLIC_PORTS=${publicPorts}`, 'bash', '/usr/local/sbin/twilite-apply-ufw'], { signal, timeoutMs: 120_000 });
  await transport.exec(['sudo', 'systemctl', 'daemon-reload'], { signal });
  await transport.exec(['sudo', 'systemctl', 'restart', 'docker'], { signal, timeoutMs: 120_000 });
}
