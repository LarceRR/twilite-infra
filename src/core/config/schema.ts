/** Typed provisioning configuration with decision-log defaults. */
import { resourceBudgetCheck } from './resource-budget.ts';
import { array_, boolean_, hostname_, integer_, maybe, object_, oneOf, port_, refine, string_, unixUser_, withDefault, type Infer } from './validate.ts';
export const FORBIDDEN_PUBLIC_PORTS = [2375,2376,5432,6379,8200,8201] as const;
const text = (fallback: string) => withDefault(string_({ minLength: 1, maxLength: 200 }), fallback);
export const provisionConfigCheck = refine(object_({
  version: withDefault(integer_({ min: 1, max: 1 }), 1),
  label: text('lumiapp'),
  target: object_({ host: hostname_(), initialUser: withDefault(unixUser_(), 'root'), initialSshPort: withDefault(port_(), 22), finalSshPort: withDefault(port_(), 5564), adminUser: withDefault(unixUser_(), 'lumiadmin'), deployUser: withDefault(unixUser_(), 'lumideploy'), hostnameOverride: maybe(hostname_()), knownHostsPath: maybe(string_({ minLength: 1 })), identityPath: maybe(string_({ minLength: 1 })), keyDirectory: text('.secrets/keys') }),
  os: object_({ distro: withDefault(oneOf(['ubuntu']), 'ubuntu'), timezone: text('UTC') }),
  preflight: object_({ minCpuCores: withDefault(integer_({ min: 1 }), 2), minMemoryMiB: withDefault(integer_({ min: 256 }), 1900), minDiskGiB: withDefault(integer_({ min: 5 }), 20), allowResourceShortage: withDefault(boolean_(), false) }),
  security: object_({ sshMaxAuthTries: withDefault(integer_({ min: 1, max: 6 }), 3), sshIdleTimeoutMinutes: withDefault(integer_({ min: 1, max: 120 }), 15), sshMaxSessions: withDefault(integer_({ min: 1, max: 10 }), 3), allowAgentForwarding: withDefault(boolean_(), false), allowTcpForwarding: withDefault(boolean_(), false), allowX11Forwarding: withDefault(boolean_(), false), passwordAuthentication: withDefault(boolean_(), false), permitRootLogin: withDefault(oneOf(['yes','no','prohibit-password']), 'no'), ipv6: withDefault(oneOf(['enabled','disabled']), 'disabled'), publicPorts: withDefault(array_(port_()), [80,443]) }),
  swap: object_({ sizeMiB: withDefault(integer_({ min: 0 }), 2048), swappiness: withDefault(integer_({ min: 0, max: 100 }), 10) }),
  docker: object_({ logDriver: withDefault(oneOf(['json-file','local']), 'json-file'), logMaxSizeMiB: withDefault(integer_({ min: 1, max: 512 }), 10), logMaxFiles: withDefault(integer_({ min: 1, max: 20 }), 3), liveRestore: withDefault(boolean_(), true) }),
  openbao: object_({ version: text('2.2.0'), tls: withDefault(boolean_(), true), unsealMode: withDefault(oneOf(['transit','kms','manual']), 'transit'), transitEndpoint: maybe(string_({ minLength: 8 })), kmsKeyId: maybe(string_({ minLength: 4 })) }),
  budget: resourceBudgetCheck,
  behavior: object_({ stepTimeoutMs: withDefault(integer_({ min: 1000 }), 120000), confirmBeforeChanges: withDefault(boolean_(), true) })
}), (config) => { const exposed = config.security.publicPorts.filter((port) => (FORBIDDEN_PUBLIC_PORTS as readonly number[]).includes(port)); if (exposed.length > 0) return `security.publicPorts must never expose infrastructure ports: ${exposed.join(', ')}`; if (config.security.publicPorts.includes(config.target.finalSshPort)) return 'security.publicPorts must not repeat the SSH port'; if (config.openbao.unsealMode === 'transit' && config.openbao.transitEndpoint === undefined) return 'openbao.transitEndpoint is required for transit unseal'; if (config.openbao.unsealMode === 'kms' && config.openbao.kmsKeyId === undefined) return 'openbao.kmsKeyId is required for KMS unseal'; return undefined; });
export type ProvisionConfig = Infer<typeof provisionConfigCheck>;
export type SecurityConfig = ProvisionConfig['security'];
export type EnvironmentName = 'production' | 'staging';
