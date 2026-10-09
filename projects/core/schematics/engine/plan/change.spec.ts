import { describe, expect, it } from 'vitest';

import { type Change, type CreateFile, skipChange, type StepResult } from './change';

const PROVENANCE = { source: 'ng-add', version: '0.1.0' } as const;

const README: CreateFile = {
  kind: 'create-file',
  id: 'helper-readme',
  label: 'Create .cngx/README.md',
  reason: 'explains what ng add installed',
  provenance: PROVENANCE,
  path: '.cngx/README.md',
  content: '# cngx\n',
};

// A step in the shape every plan* step has: plan the change unless its
// effect is already there.
function planReadme(existing: readonly string[]): StepResult {
  if (existing.includes(README.path)) {
    return { changes: [], skipped: [skipChange(README, `${README.path} already exists`)] };
  }
  return { changes: [README], skipped: [] };
}

describe('skipChange', () => {
  it('keeps the id and label of the change it replaces', () => {
    expect(skipChange(README, 'already there')).toEqual({
      id: 'helper-readme',
      label: 'Create .cngx/README.md',
      reason: 'already there',
    });
  });

  it('gives a step one id in the planned and the skipped channel', () => {
    const planned = planReadme([]);
    const skipped = planReadme(['.cngx/README.md']);

    expect(planned.changes.map((change: Change) => change.id)).toEqual(['helper-readme']);
    expect(skipped.skipped.map((step) => step.id)).toEqual(['helper-readme']);
  });

  it('does not mutate the change', () => {
    const change = { ...README };

    skipChange(change, 'already there');

    expect(change).toEqual(README);
  });
});
