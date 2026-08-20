import type { SecurityConfig } from '../config/schema.ts';

export interface SshHardeningPlan {
  readonly sshdConfigPath: string;
  readonly sshdDropInPath: string;
  readonly sshPort: number;
  readonly config: string;
  readonly verificationCommands: readonly (readonly string[])[];
}

export function buildHardeningPlan(config: Pick<SecurityConfig, 'sshMaxAuthTries' | 'sshIdleTimeoutMinutes' | 'sshMaxSessions' | 'allowAgentForwarding' | 'allowTcpForwarding' | 'allowX11Forwarding' | 'passwordAuthentication' | 'permitRootLogin'>, port: number): SshHardeningPlan {
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('SSH port must be 1..65535');
  const idleSeconds = config.sshIdleTimeoutMinutes * 60;
  const lines = [
    '# Managed by twilite-infra. Do not edit on the host.',
    `Port ${port}`,
    `MaxAuthTries ${config.sshMaxAuthTries}`,
    `ClientAliveInterval ${Math.min(300, Math.max(60, Math.floor(idleSeconds / 3)))}`,
    `ClientAliveCountMax 3`,
    `MaxSessions ${config.sshMaxSessions}`,
    `AllowAgentForwarding ${config.allowAgentForwarding ? 'yes' : 'no'}`,
    `AllowTcpForwarding ${config.allowTcpForwarding ? 'yes' : 'no'}`,
    `X11Forwarding ${config.allowX11Forwarding ? 'yes' : 'no'}`,
    `PasswordAuthentication ${config.passwordAuthentication ? 'yes' : 'no'}`,
    `PermitRootLogin ${config.permitRootLogin}`,
    'PubkeyAuthentication yes',
    'KbdInteractiveAuthentication no',
    'UsePAM yes',
    '',
  ];
  return {
    sshdConfigPath: '/etc/ssh/sshd_config',
    sshdDropInPath: '/etc/ssh/sshd_config.d/99-twilite-infra.conf',
    sshPort: port,
    config: lines.join('\n'),
    verificationCommands: [['sshd', '-t'], ['systemctl', 'reload', 'ssh']],
  };
}

export function renderSudoers(adminUser: string): string {
  if (!/^[a-z_][a-z0-9_-]{0,31}$/u.test(adminUser)) throw new Error('unsafe admin user');
  return `${adminUser} ALL=(ALL:ALL) NOPASSWD:ALL\n`;
}

export function renderAuthorizedKeys(publicKey: string): string {
  const trimmed = publicKey.trim();
  if (!/^ssh-ed25519\s+[A-Za-z0-9+/=]+(?:\s+[^\r\n]+)?$/u.test(trimmed)) throw new Error('only a valid Ed25519 public key is accepted');
  return `${trimmed}\n`;
}
