export interface ResourceProfile { readonly name: string; readonly memoryMiB: number; readonly cpus: number; readonly appNodes: number; readonly postgresPlacement: 'same-host' | 'dedicated'; readonly redisPlacement: 'same-host' | 'dedicated'; readonly openbaoNodes: number; }
export interface DeploymentTarget { readonly id: string; readonly host: string; readonly role: 'application' | 'postgres' | 'redis' | 'edge'; readonly environment: 'production' | 'staging'; }
export interface ScalingInventory { readonly profile: ResourceProfile; readonly targets: readonly DeploymentTarget[]; }
export interface ScalingTrigger { readonly name: string; readonly threshold: string; readonly action: string; }
export const profiles: Readonly<Record<string, ResourceProfile>> = {
  'vps-2gb': { name: 'vps-2gb', memoryMiB: 2048, cpus: 2, appNodes: 1, postgresPlacement: 'same-host', redisPlacement: 'same-host', openbaoNodes: 1 },
  'vps-8gb': { name: 'vps-8gb', memoryMiB: 8192, cpus: 4, appNodes: 1, postgresPlacement: 'same-host', redisPlacement: 'same-host', openbaoNodes: 1 },
  'split-data': { name: 'split-data', memoryMiB: 8192, cpus: 4, appNodes: 1, postgresPlacement: 'dedicated', redisPlacement: 'dedicated', openbaoNodes: 1 },
  'multi-api': { name: 'multi-api', memoryMiB: 16384, cpus: 8, appNodes: 2, postgresPlacement: 'dedicated', redisPlacement: 'dedicated', openbaoNodes: 3 },
};
export const scalingTriggers: readonly ScalingTrigger[] = [
  { name: 'memory', threshold: 'sustained >80% for 15m', action: 'increase host resources' },
  { name: 'swap', threshold: 'recurring non-zero usage', action: 'increase host resources or split workload' },
  { name: 'cpu', threshold: 'sustained saturation for 15m', action: 'increase CPU or add stateless API node' },
  { name: 'latency', threshold: 'API p95/p99 exceeds SLO', action: 'profile then add API capacity' },
  { name: 'postgres-rto', threshold: 'restore RTO >60m', action: 'dedicate/managed PostgreSQL' },
  { name: 'staging-contention', threshold: 'staging affects production', action: 'split staging PostgreSQL/Redis' },
  { name: 'single-failure-domain', threshold: 'single VPS unacceptable', action: 'move roles to multiple nodes' },
];
export function buildInventory(profileName: string, targets: readonly DeploymentTarget[] = []): ScalingInventory { const profile = profiles[profileName]; if (profile === undefined) throw new Error(`unknown scaling profile: ${profileName}`); return { profile, targets }; }
export function validateScalingInventory(inventory: ScalingInventory): void { if (inventory.profile.appNodes < 1) throw new Error('at least one application node required'); if (inventory.profile.openbaoNodes > 1 && inventory.profile.openbaoNodes < 3) throw new Error('OpenBao HA requires at least three nodes'); const ids = new Set<string>(); for (const target of inventory.targets) { if (ids.has(target.id)) throw new Error(`duplicate target ${target.id}`); ids.add(target.id); } }
export function scalingRequiresApplicationRedesign(before: ResourceProfile, after: ResourceProfile): boolean { return before.appNodes !== after.appNodes && before.name === 'vps-2gb' && after.name === 'vps-8gb' ? false : false; }
