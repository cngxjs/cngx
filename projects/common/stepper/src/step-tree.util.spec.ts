import { computed, signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { flatStepsEqual, flattenStepTree, stepTreeEqual } from './step-tree.util';
import type { CngxStepNode } from './stepper-host.token';

function step(id: string, depth: number, parentId: string | null = null): CngxStepNode {
  return {
    id,
    kind: 'step',
    label: id,
    disabled: false,
    state: signal('idle'),
    children: [],
    depth,
    parentId,
    flatIndex: -1,
  };
}

function group(
  id: string,
  depth: number,
  children: readonly CngxStepNode[],
  parentId: string | null = null,
): CngxStepNode {
  return {
    id,
    kind: 'group',
    label: id,
    disabled: false,
    state: computed(() => 'idle'),
    children,
    depth,
    parentId,
    flatIndex: -1,
  };
}

describe('flattenStepTree', () => {
  it('emits steps in DFS order with monotonic flatIndex', () => {
    const tree = [
      step('a', 0),
      group('g', 0, [step('b', 1, 'g'), step('c', 1, 'g')]),
      step('d', 0),
    ];
    const flat = flattenStepTree(tree);
    const ids = flat.map((n) => n.id);
    expect(ids).toEqual(['a', 'g', 'b', 'c', 'd']);
    // Step nodes get monotonic indices; group node carries -1.
    const stepIndexMap = flat
      .filter((n) => n.kind === 'step')
      .map((n) => ({ id: n.id, idx: n.flatIndex }));
    expect(stepIndexMap).toEqual([
      { id: 'a', idx: 0 },
      { id: 'b', idx: 1 },
      { id: 'c', idx: 2 },
      { id: 'd', idx: 3 },
    ]);
    expect(flat.find((n) => n.id === 'g')!.flatIndex).toBe(-1);
  });

  it('handles deeply nested groups (3 levels)', () => {
    const tree = [
      group('g1', 0, [
        group('g2', 1, [step('s1', 2, 'g2'), step('s2', 2, 'g2')], 'g1'),
        step('s3', 1, 'g1'),
      ]),
    ];
    const flat = flattenStepTree(tree);
    expect(flat.map((n) => n.id)).toEqual(['g1', 'g2', 's1', 's2', 's3']);
    const stepIndices = flat.filter((n) => n.kind === 'step').map((n) => n.flatIndex);
    expect(stepIndices).toEqual([0, 1, 2]);
  });
});

describe('stepTreeEqual', () => {
  it('returns true for reference-identical inputs', () => {
    const tree = [step('a', 0)];
    expect(stepTreeEqual(tree, tree)).toBe(true);
  });

  it('returns true when shape is identical even when reactive fields differ', () => {
    const a = [step('a', 0)];
    const b = [step('a', 0)];
    expect(stepTreeEqual(a, b)).toBe(true);
  });

  it('returns false on length mismatch', () => {
    expect(stepTreeEqual([step('a', 0)], [step('a', 0), step('b', 0)])).toBe(false);
  });

  it('returns false on id mismatch', () => {
    expect(stepTreeEqual([step('a', 0)], [step('b', 0)])).toBe(false);
  });

  it('returns false on nested-group structural change', () => {
    const a = [group('g', 0, [step('s1', 1, 'g')])];
    const b = [group('g', 0, [step('s1', 1, 'g'), step('s2', 1, 'g')])];
    expect(stepTreeEqual(a, b)).toBe(false);
  });
});

describe('flatStepsEqual', () => {
  it('returns true when ids + depth + flatIndex match', () => {
    const a = flattenStepTree([step('a', 0), step('b', 0)]);
    const b = flattenStepTree([step('a', 0), step('b', 0)]);
    expect(flatStepsEqual(a, b)).toBe(true);
  });

  it('returns false when flatIndex shifts (insertion before a node)', () => {
    const before = flattenStepTree([step('a', 0), step('b', 0)]);
    const after = flattenStepTree([step('x', 0), step('a', 0), step('b', 0)]);
    // 'a' moves from flatIndex 0 to 1.
    expect(flatStepsEqual(before, after)).toBe(false);
  });
});
