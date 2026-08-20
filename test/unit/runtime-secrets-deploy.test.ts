import { match, ok, strictEqual } from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { resolveConfig } from '../../src/core/config/load.ts';
import { renderDockerDaemonConfig } from '../../src/core/security/baseline.ts';

const read = (path: string): string => readFileSync(path, 'utf8');
const composeBase = read('infra/compose/base/compose.yaml');
const composeProd = read('infra/compose/production/compose.yaml');
const composeStage = read('infra/compose/staging/compose.yaml');
const deploy = read('infra/deploy/deploy.sh');
const rollback = read('infra/deploy/rollback.sh');

function validConfig() {
  const result = resolveConfig({ target: { host: '127.0.0.1' }, security: { publicPorts: [] }, openbao: { unsealMode: 'manual' } }, 'test');
  ok(result.ok);
  return result.ok ? result.value.config : undefined;
}

test('Compose declares separate production and staging networks and projects', () => {
  match(composeProd, /name: \$\{PROD_PROJECT_NAME/);
  match(composeStage, /name: \$\{STAGE_PROJECT_NAME/);
  match(composeProd, /name: lumi_prod_net/);
  match(composeStage, /name: lumi_stage_net/);
  strictEqual(composeProd.includes('lumi_stage_net'), false);
  strictEqual(composeStage.includes('lumi_prod_net'), false);
});

test('Compose pins images by digest and uses bounded runtime resources', () => {
  for (const compose of [composeBase, composeProd, composeStage]) {
    match(compose, /image: .*@sha256:/);
    match(compose, /restart: unless-stopped/);
    match(compose, /healthcheck:/);
  }
  match(composeProd, /mem_limit: 384m/);
  match(composeStage, /mem_limit: 192m/);
  match(composeBase, /mem_limit: 384m/);
  match(composeBase, /mem_limit: 96m/);
  strictEqual(composeProd.includes(':latest'), false);
  strictEqual(composeStage.includes(':latest'), false);
});

test('Compose keeps secrets as Docker secrets and not inline values', () => {
  match(composeProd, /prod_database_url/);
  match(composeProd, /prod_openbao_token/);
  match(composeStage, /stage_smoke_credential/);
  strictEqual(composeProd.includes('PASSWORD='), false);
  strictEqual(composeStage.includes('TOKEN='), false);
});

test('OpenBao policy files isolate production and staging paths', () => {
  const prod = read('infra/openbao/policies/production-api.hcl');
  const stage = read('infra/openbao/policies/staging-api.hcl');
  const openbao = read('infra/openbao/config/openbao.hcl');
  match(prod, /secret\/data\/production\/api/);
  match(stage, /secret\/data\/staging\/api/);
  strictEqual(prod.includes('staging'), false);
  strictEqual(stage.includes('production'), false);
  match(openbao, /storage "raft"/);
  match(openbao, /tls_min_version = "tls13"/);
});

test('deployment requires digest, separates migration and readiness gates', () => {
  match(deploy, /API_IMAGE_DIGEST.*sha256/);
  match(deploy, /docker pull/);
  match(deploy, /\/app\/bin\/migrate/);
  match(deploy, /health\/ready/);
  match(deploy, /curl --fail/);
  match(deploy, /previous\.digest/);
  match(rollback, /previous\.digest/);
  strictEqual(deploy.includes('latest'), false);
});

test('Docker daemon config remains Unix-socket-only', () => {
  const config = validConfig();
  ok(config !== undefined);
  if (config === undefined) return;
  const rendered = renderDockerDaemonConfig(config);
  match(rendered, /unix:\/\/\/var\/run\/docker\.sock/);
  strictEqual(rendered.includes('tcp://'), false);
});
