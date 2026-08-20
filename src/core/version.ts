import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
export const CLI_VERSION = (() => { try { const here = dirname(fileURLToPath(import.meta.url)); const parsed = JSON.parse(readFileSync(join(here, '..', '..', 'package.json'), 'utf8')) as { version?: unknown }; return typeof parsed.version === 'string' ? parsed.version : '0.0.0'; } catch { return '0.0.0'; } })();
