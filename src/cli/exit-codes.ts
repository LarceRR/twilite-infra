export const ExitCode = { ok: 0, failed: 1, usage: 2, config: 3, locked: 4, cancelled: 130 } as const;
export type ExitCodeValue = (typeof ExitCode)[keyof typeof ExitCode];
