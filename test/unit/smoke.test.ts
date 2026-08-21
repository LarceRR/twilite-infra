import { strictEqual } from 'node:assert/strict';
import { test } from 'node:test';
import { PHASES } from '../../src/core/state/types.ts';
import { summariseBudget, resourceBudgetCheck } from '../../src/core/config/resource-budget.ts';

test('foundation exposes the mandated provisioning order and 2 GiB budget', () => {
  strictEqual(PHASES[0], 'CONNECT');
  strictEqual(PHASES.at(-1), 'READY');
  const checked = resourceBudgetCheck(undefined, 'budget');
  strictEqual(checked.ok, true);
  if (checked.ok) strictEqual(summariseBudget(checked.value).committedMiB, 1920);
});
