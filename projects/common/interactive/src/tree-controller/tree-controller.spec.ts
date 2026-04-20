import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type CngxTreeNode } from '@cngx/utils';
import { describe, expect, it } from 'vitest';
import { createTreeController } from './tree-controller';

interface Row {
  readonly id: string;
  readonly name: string;
}

function makeTree(): CngxTreeNode<Row>[] {
  return [
    {
      value: { id: 'a', name: 'Alpha' },
      children: [
        { value: { id: 'a1', name: 'Alpha-1' } },
        {
          value: { id: 'a2', name: 'Alpha-2' },
          children: [{ value: { id: 'a2a', name: 'Alpha-2-a' } }],
        },
      ],
    },
    { value: { id: 'b', name: 'Bravo' } },
  ];
}

function makeController(tree = makeTree()) {
  const nodes = signal(tree);
  return TestBed.runInInjectionContext(() =>
    createTreeController<Row>({
      nodes,
      nodeIdFn: (v) => v.id,
      labelFn: (v) => v.name,
      keyFn: (v) => v.id,
    }),
  );
}

describe('createTreeController — derivation contract', () => {
  it('flattens DFS with stable ids; adItems mirrors visibleNodes (not all flatNodes)', () => {
    const ctrl = makeController();
    expect(ctrl.flatNodes().map((n) => n.id)).toEqual(['a', 'a1', 'a2', 'a2a', 'b']);
    // adItems is the AD-navigation surface — collapsed descendants are hidden
    // from the keyboard flow by definition.
    expect(ctrl.adItems().map((i) => i.id)).toEqual(['a', 'b']);
    ctrl.expandAll();
    expect(ctrl.adItems().map((i) => i.id)).toEqual(['a', 'a1', 'a2', 'a2a', 'b']);
    expect(ctrl.adItems()[0]).toEqual({
      id: 'a',
      value: { id: 'a', name: 'Alpha' },
      label: 'Alpha',
      disabled: false,
    });
  });

  it('hides descendants of collapsed ancestors; filters adItems accordingly', () => {
    const ctrl = makeController();
    expect(ctrl.visibleNodes().map((n) => n.id)).toEqual(['a', 'b']);
    ctrl.expand('a');
    expect(ctrl.visibleNodes().map((n) => n.id)).toEqual(['a', 'a1', 'a2', 'b']);
    ctrl.expand('a2');
    expect(ctrl.visibleNodes().map((n) => n.id)).toEqual(['a', 'a1', 'a2', 'a2a', 'b']);
    expect(ctrl.adItems().map((i) => i.id)).toEqual(['a', 'a1', 'a2', 'a2a', 'b']);
  });

  it('isExpanded(id) returns a stable Signal instance per id', () => {
    const ctrl = makeController();
    const s1 = ctrl.isExpanded('a');
    const s2 = ctrl.isExpanded('a');
    expect(s1).toBe(s2);
    expect(s1()).toBe(false);
    ctrl.toggle('a');
    expect(s1()).toBe(true);
  });

  it('exposes value-based lookups for selection childrenFn + cascade-select', () => {
    const ctrl = makeController();
    const a: Row = { id: 'a', name: 'Alpha' };
    expect(ctrl.childrenOfValue(a).map((v) => v.id)).toEqual(['a1', 'a2']);
    expect(ctrl.descendantsOfValue(a).map((v) => v.id)).toEqual(['a1', 'a2', 'a2a']);
  });

  it('expandAll collects every parent id; collapseAll clears; toggle flips', () => {
    const ctrl = makeController();
    ctrl.expandAll();
    expect([...ctrl.expandedIds()].sort()).toEqual(['a', 'a2']);
    ctrl.collapseAll();
    expect(ctrl.expandedIds().size).toBe(0);
    ctrl.toggle('a');
    expect(ctrl.expandedIds().has('a')).toBe(true);
    ctrl.toggle('a');
    expect(ctrl.expandedIds().has('a')).toBe(false);
  });

  it('findById / parentOf / firstChildOf navigate the flat projection', () => {
    const ctrl = makeController();
    expect(ctrl.findById('a2a')?.label).toBe('Alpha-2-a');
    expect(ctrl.findById('missing')).toBeUndefined();
    expect(ctrl.parentOf('a2a')?.id).toBe('a2');
    expect(ctrl.parentOf('a')).toBeUndefined();
    expect(ctrl.firstChildOf('a')?.id).toBe('a1');
    expect(ctrl.firstChildOf('b')).toBeUndefined();
  });

  it('initiallyExpanded seeds the set; "all" expands every parent', () => {
    const nodes = signal(makeTree());
    const ctrlA = TestBed.runInInjectionContext(() =>
      createTreeController<Row>({
        nodes,
        nodeIdFn: (v) => v.id,
        initiallyExpanded: 'all',
      }),
    );
    expect([...ctrlA.expandedIds()].sort()).toEqual(['a', 'a2']);

    const ctrlB = TestBed.runInInjectionContext(() =>
      createTreeController<Row>({
        nodes,
        nodeIdFn: (v) => v.id,
        initiallyExpanded: ['a'],
      }),
    );
    expect([...ctrlB.expandedIds()]).toEqual(['a']);
  });

  it('destroy() freezes isExpanded to a shared false-signal', () => {
    const ctrl = makeController();
    ctrl.expand('a');
    const live = ctrl.isExpanded('a');
    expect(live()).toBe(true);
    ctrl.destroy();
    const post = ctrl.isExpanded('a');
    expect(post).not.toBe(live);
    expect(post()).toBe(false);
    // idempotent
    ctrl.destroy();
  });

  it('10k-node flatten + visibleNodes stays well under 16ms budget', () => {
    // Three-level fan-out: 10 × 10 × 100 = 10_000
    const tree: CngxTreeNode<Row>[] = [];
    for (let a = 0; a < 10; a++) {
      const aChildren: CngxTreeNode<Row>[] = [];
      for (let b = 0; b < 10; b++) {
        const bChildren: CngxTreeNode<Row>[] = [];
        for (let c = 0; c < 100; c++) {
          bChildren.push({ value: { id: `${a}.${b}.${c}`, name: `${a}-${b}-${c}` } });
        }
        aChildren.push({
          value: { id: `${a}.${b}`, name: `${a}-${b}` },
          children: bChildren,
        });
      }
      tree.push({ value: { id: `${a}`, name: `${a}` }, children: aChildren });
    }
    const ctrl = makeController(tree);

    const t0 = performance.now();
    const flat = ctrl.flatNodes();
    const t1 = performance.now();
    expect(flat.length).toBe(10_110); // 10 + 100 + 10_000
    expect(t1 - t0).toBeLessThan(16);

    // Fully expanded: visible = all 10_110
    ctrl.expandAll();
    const t2 = performance.now();
    const vis = ctrl.visibleNodes();
    const t3 = performance.now();
    expect(vis.length).toBe(10_110);
    expect(t3 - t2).toBeLessThan(16);
  });
});
