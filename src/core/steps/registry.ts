import { permanent } from '../errors.ts';
import { err, ok, type Result } from '../result.ts';
import { PHASES, phaseIndex, type Phase } from '../state/types.ts';
import type { Step } from './types.ts';
export interface StepRegistry { readonly steps: readonly Step[]; forPhase(phase: Phase): readonly Step[]; ids(): readonly string[]; get(stepId: string): Step | undefined; }
export function createRegistry(steps: readonly Step[]): Result<StepRegistry> { const seen = new Set<string>(); for (const step of steps) { if (seen.has(step.id)) return err(permanent('E_STEP_DUPLICATE', `duplicate step id: ${step.id}`)); seen.add(step.id); if (!(PHASES as readonly string[]).includes(step.phase)) return err(permanent('E_STEP_PHASE', `unknown phase ${step.phase}`)); } const ordered = [...steps].sort((a,b) => phaseIndex(a.phase) - phaseIndex(b.phase)); const byId = new Map(ordered.map((step) => [step.id, step])); return ok({ steps: ordered, forPhase: (phase) => ordered.filter((step) => step.phase === phase), ids: () => ordered.map((step) => step.id), get: (id) => byId.get(id) }); }
export const provisioningSteps: readonly Step[] = [];
