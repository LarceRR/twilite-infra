import type { ProvisionConfig, SecurityConfig } from '../config/schema.ts';

export interface BaselineFile {
  readonly path: string;
  readonly mode: number;
  readonly content: string;
}

export interface BaselinePlan {
  readonly files: readonly BaselineFile[];
  readonly packages: readonly string[];
  readonly publicPorts: readonly number[];
  readonly sshPort: number;
  readonly ipv6: 'enabled' | 'disabled';
  readonly verificationCommands: readonly (readonly string[])[];
}

const BASE_PACKAGES = [
  'ca-certificates',
  'curl',
  'gnupg',
  'jq',
  'apparmor',
  'apparmor-utils',
  'auditd',
  'fail2ban',
  'ufw',
  'unattended-upgrades',
  'apt-listchanges',
  'systemd-timesyncd',
  'util-linux',
] as const;

export function buildBaselinePlan(config: ProvisionConfig, hostname: string): BaselinePlan {
  assertHostname(hostname);
  const sshPort = config.target.finalSshPort;
  const publicPorts = [...new Set([sshPort, ...config.security.publicPorts])].sort((a, b) => a - b);
  return {
    packages: BASE_PACKAGES,
    publicPorts,
    sshPort,
    ipv6: config.security.ipv6,
    files: [
      { path: '/etc/default/ufw', mode: 0o644, content: renderUfwDefaults(config.security.ipv6) },
      { path: '/etc/docker/daemon.json', mode: 0o644, content: renderDockerDaemonConfig(config) },
      { path: '/etc/systemd/system/docker.service.d/10-twilite.conf', mode: 0o644, content: renderDockerSystemdDropIn() },
      { path: '/etc/systemd/journald.conf.d/99-twilite.conf', mode: 0o644, content: renderJournaldConfig() },
      { path: '/etc/fail2ban/jail.d/twilite-ssh.local', mode: 0o644, content: renderFail2banJail(sshPort) },
      { path: '/etc/apt/apt.conf.d/20auto-upgrades', mode: 0o644, content: renderAutoUpdates() },
      { path: '/etc/apt/apt.conf.d/52twilite-unattended-upgrades', mode: 0o644, content: renderUnattendedUpgradePolicy() },
      { path: '/etc/sysctl.d/99-twilite-baseline.conf', mode: 0o644, content: renderSysctlConfig() },
      { path: '/usr/local/sbin/twilite-apply-ufw', mode: 0o750, content: renderUfwScript(sshPort, config.security) },
      { path: '/usr/local/sbin/twilite-verify-baseline', mode: 0o750, content: renderBaselineVerifyScript(sshPort, publicPorts) },
    ],
    verificationCommands: [
      ['systemctl', 'is-enabled', 'systemd-timesyncd'],
      ['aa-enabled'],
      ['ufw', 'status', 'verbose'],
      ['fail2ban-client', 'status', 'sshd'],
      ['docker', 'info', '--format', '{{json .SecurityOptions}}'],
      ['ss', '-lntup'],
    ],
  };
}

export function renderUfwDefaults(ipv6: SecurityConfig['ipv6']): string {
  return `# Managed by twilite-infra. IPv6 policy is explicit.\nIPV6=${ipv6 === 'enabled' ? 'yes' : 'no'}\nDEFAULT_INPUT_POLICY="DROP"\nDEFAULT_OUTPUT_POLICY="ACCEPT"\nDEFAULT_FORWARD_POLICY="DROP"\nDEFAULT_APPLICATION_POLICY="SKIP"\nMANAGE_BUILTINS=no\n`;
}

export function renderDockerDaemonConfig(config: ProvisionConfig): string {
  return `${JSON.stringify({
    hosts: ['unix:///var/run/docker.sock'],
    'log-driver': config.docker?.logDriver ?? 'json-file',
    'log-opts': {
      'max-size': `${config.docker?.logMaxSizeMiB ?? 10}m`,
      'max-file': String(config.docker?.logMaxFiles ?? 3),
    },
    'live-restore': config.docker?.liveRestore ?? true,
    'userland-proxy': false,
    iptables: true,
  }, null, 2)}\n`;
}

export function renderDockerSystemdDropIn(): string {
  return `[Unit]\nDescription=Twilite Docker daemon policy\nAfter=network-online.target\nWants=network-online.target\n\n[Service]\nExecStart=\nExecStart=/usr/bin/dockerd --config-file=/etc/docker/daemon.json\nRestart=on-failure\nRestartSec=5s\nLimitNOFILE=1048576\n`;
}

export function renderJournaldConfig(): string {
  return `[Journal]\nStorage=persistent\nSystemMaxUse=200M\nSystemMaxFileSize=50M\nMaxRetentionSec=14day\nCompress=yes\nSeal=yes\nForwardToSyslog=no\n`;
}

export function renderFail2banJail(sshPort: number): string {
  assertPort(sshPort);
  return `[DEFAULT]\nbackend = systemd\nbanaction = nftables-multiport\nbantime = 1h\nfindtime = 10m\nmaxretry = 5\nignoreip = 127.0.0.1/8 ::1\n\n[sshd]\nenabled = true\nport = ${sshPort}\nfilter = sshd\nlogpath = %(sshd_log)s\nmaxretry = 3\n`;
}

export function renderAutoUpdates(): string {
  return `APT::Periodic::Update-Package-Lists "1";\nAPT::Periodic::Unattended-Upgrade "1";\n`;
}

export function renderUnattendedUpgradePolicy(): string {
  return `Unattended-Upgrade::Allowed-Origins {\n  "\${distro_id}:\${distro_codename}-security";\n};\nUnattended-Upgrade::Remove-Unused-Dependencies "true";\nUnattended-Upgrade::Automatic-Reboot "false";\n`;
}

export function renderSysctlConfig(): string {
  return `# Managed by twilite-infra. Only measured, security-relevant defaults live here.\nnet.ipv4.conf.all.rp_filter=1\nnet.ipv4.conf.default.rp_filter=1\nnet.ipv4.icmp_echo_ignore_broadcasts=1\nnet.ipv4.conf.all.accept_source_route=0\nnet.ipv4.conf.default.accept_source_route=0\nnet.ipv4.conf.all.send_redirects=0\nnet.ipv4.conf.default.send_redirects=0\n`;
}

export function renderUfwScript(sshPort: number, security: Pick<SecurityConfig, 'publicPorts' | 'ipv6'>): string {
  assertPort(sshPort);
  const webPorts = security.publicPorts.filter((port) => port !== sshPort);
  const allowLines = webPorts.map((port) => `ufw allow ${port}/tcp comment 'twilite public'`).join('\n');
  return `#!/usr/bin/env bash\nset -Eeuo pipefail\n\nSSH_PORT="${sshPort}"\nRESET="\${TWILITE_FIREWALL_RESET:-0}"\nif [[ "$RESET" == "1" ]]; then\n  ufw --force reset\nfi\nufw default deny incoming\nufw default allow outgoing\nufw delete allow 22/tcp >/dev/null 2>&1 || true\nufw allow "$SSH_PORT"/tcp comment 'twilite ssh'\n${allowLines}\nufw --force enable\nufw status verbose\n`;
}

export function renderBaselineVerifyScript(sshPort: number, publicPorts: readonly number[]): string {
  assertPort(sshPort);
  for (const port of publicPorts) assertPort(port);
  return `#!/usr/bin/env bash\nset -Eeuo pipefail\n\nSSH_PORT="${sshPort}"\nEXPECTED_PORTS=( ${publicPorts.join(' ')} )\ncommand -v ufw >/dev/null\ncommand -v fail2ban-client >/dev/null\ncommand -v docker >/dev/null\ncommand -v aa-enabled >/dev/null\nufw status | grep -q "${sshPort}/tcp"\nfail2ban-client status sshd >/dev/null\ndocker info --format '{{json .SecurityOptions}}' >/dev/null\naa-enabled >/dev/null\nfor port in "\${EXPECTED_PORTS[@]}"; do\n  ss -lnt "( sport = :$port )" >/dev/null 2>&1 || true\ndone\necho 'twilite baseline verification passed'\n`;
}

function assertPort(port: number): void {
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`invalid port: ${port}`);
}

function assertHostname(hostname: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9.-]{0,252}$/u.test(hostname)) throw new Error('invalid hostname');
}
