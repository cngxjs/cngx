import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createTreeController } from '@cngx/common/interactive';
import type { CngxTreeNode } from '@cngx/utils';
import { describe, expect, it } from 'vitest';

import { createTreeSelectionCounts } from './tree-selection-counts';

interface Row {
  readonly id: string;
}

function nodes(): CngxTreeNode<Row>[] {
  return [
    {
      value: { id: 'fe' },
      children: [
        { value: { id: 'web' }, children: [{ value: { id: 'ng' } }, { value: { id: 'react' } }] },
        { value: { id: 'mobile' } },
      ],
    },
    { value: { id: 'be' } },
  ];
}

function setup(initial: string[]) {
  const tree = signal(nodes());
  const values = signal<Row[]>(initial.map((id) => ({ id })));
  const tc = TestBed.runInInjectionContext(() =>
    createTreeController<Row>({ nodes: tree, nodeIdFn: (v) => v.id, keyFn: (v) => v.id }),
  );
  const counts = createTreeSelectionCounts<Row>({
    flatNodes: tc.flatNodes,
    values,
    findByValue: (v) => tc.findByValue(v),
  });
  const of = (id: string) => counts().get(id);
  return { tree, values, counts, of };
}

describe('createTreeSelectionCounts', () => {
  it('counts every descendant level of a parent', () => {
    const t = setup([]);
    expect(t.of('fe')).toEqual({ selected: 0, total: 4 });
    expect(t.of('web')).toEqual({ selected: 0, total: 2 });
    expect(t.of('ng')).toBeUndefined();
    expect(t.of('be')).toBeUndefined();
  });

  it('counts partial and full selection, the parent itself excluded', () => {
    const t = setup(['ng']);
    expect(t.of('fe')).toEqual({ selected: 1, total: 4 });
    expect(t.of('web')).toEqual({ selected: 1, total: 2 });
    t.values.set(['fe', 'web', 'ng', 'react', 'mobile'].map((id) => ({ id })));
    expect(t.of('fe')).toEqual({ selected: 4, total: 4 });
    expect(t.of('web')).toEqual({ selected: 2, total: 2 });
  });

  it('matches keyFn-equal value objects', () => {
    const t = setup([]);
    t.values.set([{ id: 'react' }]);
    expect(t.of('web')).toEqual({ selected: 1, total: 2 });
  });

  it('keeps its identity while the counts do not change and follows a node swap', () => {
    const t = setup(['ng']);
    const first = t.counts();
    t.values.set([{ id: 'ng' }, { id: 'be' }]);
    expect(t.counts()).toBe(first);
    t.tree.set([{ value: { id: 'fe' }, children: [{ value: { id: 'ng' } }] }]);
    expect(t.of('fe')).toEqual({ selected: 1, total: 1 });
    expect(t.of('web')).toBeUndefined();
  });
});
