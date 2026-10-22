import { describe, expect, it } from 'vitest';

import {
  type Change,
  createNote,
  type CreateFile,
  createProvenance,
  mergeStepResults,
  renderProviderCall,
  skipChange,
  type StepResult,
} from './change';

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

describe('mergeStepResults', () => {
  const note = (id: string): Change => ({
    kind: 'note',
    id,
    label: id,
    reason: 'spec',
    provenance: PROVENANCE,
  });

  it('concatenates changes and skips in step order', () => {
    const merged = mergeStepResults([
      planReadme([]),
      { changes: [note('first')], skipped: [{ id: 'a', label: 'A', reason: 'in place' }] },
      planReadme(['.cngx/README.md']),
      { changes: [note('second')], skipped: [] },
    ]);

    expect(merged.changes.map((change) => change.id)).toEqual(['helper-readme', 'first', 'second']);
    expect(merged.skipped.map((step) => step.id)).toEqual(['a', 'helper-readme']);
  });

  it('merges nothing into an empty result', () => {
    expect(mergeStepResults([])).toEqual({ changes: [], skipped: [] });
  });
});

describe('createProvenance', () => {
  it('records the generator and the release', () => {
    expect(createProvenance('ng-update', '0.2.0')).toEqual({
      source: 'ng-update',
      version: '0.2.0',
    });
  });
});

describe('createNote', () => {
  it('builds a note that touches no file', () => {
    const provenance = createProvenance('ng-add', '0.1.0');

    expect(
      createNote({ id: 'lint:config', label: 'Skip', reason: 'no config', provenance }),
    ).toEqual({
      kind: 'note',
      id: 'lint:config',
      label: 'Skip',
      reason: 'no config',
      provenance,
    });
  });

  it('carries no field beyond a note, whatever the input spreads in', () => {
    const input = { ...README, provenance: PROVENANCE };

    expect(Object.keys(createNote(input))).toEqual(['kind', 'id', 'label', 'reason', 'provenance']);
  });
});

describe('renderProviderCall', () => {
  it('renders nested calls, references, arrays and literals, the callee bound before its arguments', () => {
    const bound: string[] = [];
    const text = renderProviderCall(
      {
        symbol: 'provideFloatingFallback',
        module: '@cngx/common/popover',
        args: [
          { symbol: 'computePosition', module: '@floating-ui/dom', reference: true },
          { array: [{ symbol: 'flip', module: '@floating-ui/dom' }, { literal: "'x'" }] },
        ],
      },
      (symbol) => {
        bound.push(symbol);
        return symbol;
      },
    );

    expect(text).toBe("provideFloatingFallback(computePosition, [flip(), 'x'])");
    expect(bound).toEqual(['provideFloatingFallback', 'computePosition', 'flip']);
  });
});
