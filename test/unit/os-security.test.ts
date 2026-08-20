import { match, ok, strictEqual } from 'node:assert/strict';
import { test } from 'node:test';
import { resolveConfig } from '../../src/core/config/load.ts';
import { buildBaselinePlan, renderDockerDaemonConfig, renderFail2banJail, renderUfwScript } from '../../src/core/security/baseline.ts';

function config(publicPorts: number[] = []): ReturnType<typeof resolveConfig> {
  return resolveConfig({ target: { host: '127.0.0.1' }, security: { publicPorts }, openbao: { unsealMode: 'manual' } }, 'test');
}

test('baseline plan keeps infrastructure ports private and exposes only inventory ports', () => {
  const resolved = config([80, 443]);
  ok(resolved.ok);
  if (!resolved.ok) return;
  const plan = buildBaselinePlan(resolved.value.config, 'twilite-test');
  strictEqual(plan.sshPort, 5564);
  strictEqual(plan.publicPorts.includes(5432), false);
  strictEqual(plan.publicPorts.includes(80), true);
  strictEqual(plan.files.length >= 10, true);
});

test('Docker daemon policy is Unix-socket only and logs rotate', () => {
  const resolved = config();
  ok(resolved.ok);
  if (!resolved.ok) return;
  const rendered = renderDockerDaemonConfig(resolved.value.config);
  match(rendered, /unix:\/\/\/var\/run\/docker\.sock/);
  match(rendered, /max-size/);
  match(rendered, /live-restore/);
  strictEqual(rendered.includes('tcp://'), false);
});

test('UFW script defaults to SSH only when no public ports are configured', () => {
  const resolved = config();
  ok(resolved.ok);
  if (!resolved.ok) return;
  const script = renderUfwScript(5564, resolved.value.config.security);
  match(script, /ufw allow \"\$SSH_PORT\"\/tcp/);
  strictEqual(script.includes('ufw allow 80\/tcp'), false);
  strictEqual(script.includes('ufw allow 443\/tcp'), false);
  match(script, /TWILITE_FIREWALL_RESET/);
});

test('Fail2ban uses systemd journal and nftables for the final SSH port', () => {
  const jail = renderFail2banJail(5564);
  match(jail, /backend = systemd/);
  match(jail, /banaction = nftables-multiport/);
  match(jail, /port = 5564/);
  match(jail, /maxretry = 3/);
});

test('config makes IPv6 policy explicit', () => {
  const resolved = config();
  ok(resolved.ok);
  if (!resolved.ok) return;
  strictEqual(resolved.value.config.security.ipv6, 'disabled');
});
