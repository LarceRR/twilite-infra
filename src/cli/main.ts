#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { loadConfigFile } from '../core/config/load.ts';
import { formatBudget } from '../core/config/resource-budget.ts';
import { createLogger } from '../core/logging/logger.ts';
import { CLI_VERSION } from '../core/version.ts';
import { provisionRealHost } from './provision-real.ts';
import { ExitCode, type ExitCodeValue } from './exit-codes.ts';

const usage = `twilite-infra <command>\n\ncommands: plan, provision, resume, status, report, reset, doctor, version\noptions: --config <path>, --dry-run, --yes\n\nReal provisioning requires Linux/WSL2 and an explicit disposable-host fingerprint acceptance.\n`;

function value(argv: readonly string[], flag: string): string | undefined { const index = argv.indexOf(flag); return index < 0 ? undefined : argv[index + 1]; }

export async function main(argv: readonly string[]): Promise<ExitCodeValue> {
  const command = argv[0] ?? 'help';
  if (command === 'help' || command === '--help') { process.stdout.write(usage); return ExitCode.ok; }
  if (command === 'version' || command === '--version') { process.stdout.write(`${CLI_VERSION}\n`); return ExitCode.ok; }
  if (command === 'doctor') { const checks = [process.versions.node.startsWith('22.'), hasBinary('ssh')]; process.stdout.write(`${JSON.stringify({ node: process.version, ssh: checks[1], linux: process.platform === 'linux', wsl2: process.platform === 'linux' }, null, 2)}\n`); return checks.every(Boolean) ? ExitCode.ok : ExitCode.failed; }

  const configPath = value(argv, '--config');
  if (configPath === undefined) { process.stderr.write(`${usage}missing --config\n`); return ExitCode.usage; }
  const resolved = loadConfigFile(configPath);
  if (!resolved.ok) { process.stderr.write(`${resolved.error.code}: ${resolved.error.message}\n`); return ExitCode.config; }
  const config = resolved.value.config;

  if (command === 'plan' || argv.includes('--dry-run')) {
    process.stdout.write(`target: ${config.label}@${config.target.host}:${config.target.initialSshPort}\n`);
    process.stdout.write('mode: dry-run, no remote mutation\n');
    process.stdout.write(`fingerprint: ${resolved.value.fingerprint}\n`);
    for (const line of formatBudget(config.budget)) process.stdout.write(`${line}\n`);
    return ExitCode.ok;
  }
  if (command !== 'provision' && command !== 'resume') { process.stderr.write(`${usage}unknown command: ${command}\n`); return ExitCode.usage; }
  const controller = new AbortController();
  const onSignal = (): void => controller.abort(new Error('operator cancelled provisioning'));
  process.once('SIGINT', onSignal);
  const runId = `${config.label}-${Date.now()}`;
  const logger = createLogger(runId, join('.artifacts', `${runId}.jsonl`));
  try {
    await provisionRealHost({ config, repoRoot: process.cwd(), logger, signal: controller.signal });
    process.stdout.write(`provisioning complete: ${config.target.host}\n`);
    return ExitCode.ok;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.log('ERROR', 'provision.failed', { message });
    process.stderr.write(`provisioning failed: ${message}\n`);
    return ExitCode.failed;
  } finally {
    process.removeListener('SIGINT', onSignal);
  }
}

function hasBinary(binary: string): boolean { try { execFileSync(binary, ['-V'], { stdio: 'ignore', timeout: 5000 }); return true; } catch { return false; } }
const direct = process.argv[1] !== undefined && import.meta.filename === process.argv[1];
if (direct) process.exitCode = await main(process.argv.slice(2));
