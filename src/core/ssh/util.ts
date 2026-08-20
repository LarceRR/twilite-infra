import { createHash } from 'node:crypto';

export function monotonicNow(): number {
  return Number(process.hrtime.bigint()) / 1_000_000;
}

export function assertSafeSshToken(value: string, field: string): void {
  if (value.length === 0 || value.startsWith('-') || /[\r\n\t ]/.test(value)) {
    throw new Error(`${field} contains unsafe SSH token characters`);
  }
}

export function controlPathFor(target: { readonly user: string; readonly host: string; readonly port: number; }, base = '~/.ssh/cm'): string {
  const digest = createHash('sha256').update(`${target.user}@${target.host}:${target.port}`).digest('hex').slice(0, 24);
  return `${base}-${digest}`;
}
