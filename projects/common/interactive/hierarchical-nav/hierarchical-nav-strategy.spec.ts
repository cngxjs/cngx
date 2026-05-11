import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type CngxTreeNode } from '@cngx/utils';
import { describe, expect, it, vi } from 'vitest';
import { createTreeController } from '../tree-controller/tree-controller';
import {
  createW3CTreeStrategy,
  type CngxHierarchicalNavContext,
} from './hierarchical-nav-strategy';

interface Row {
  readonly id: string;
}

const tree: CngxTreeNode<Row>[] = [
  {
    value: { id: 'a' },
    children: [{ value: { id: 'a1' } }, { value: { id: 'a2' } }],
  },
  { value: { id: 'b' } },
];

function setup() {
  const ctrl = TestBed.runInInjectionContext(() =>
    createTreeController<Row>({
      nodes: signal(tree),
      nodeIdFn: (v) => v.id,
    }),
  );
  const highlightByValue = vi.fn();
  let activeId = 'a';
  const ad = {
    activeId: () => activeId,
    highlightByValue: (value: unknown) => {
      highlightByValue(value);
      // Simulate AD resolving the value to its id (matches the controller's
      // keyFn-default identity on the value object).
      const flat = ctrl.findByValue(value as Row);
      if (flat) {
        activeId = flat.id;
      }
    },
  };
  const ctx = (id: string): CngxHierarchicalNavContext<Row> => {
    activeId = id;
    return {
      controller: ctrl,
      ad: ad as unknown as CngxHierarchicalNavContext<Row>['ad'],
      activeId: id,
    };
  };
  return { ctrl, ad, highlightByValue, ctx };
}

describe('createW3CTreeStrategy', () => {
  it('ArrowRight expands a collapsed parent', () => {
    const { ctrl, ctx } = setup();
    const strategy = createW3CTreeStrategy();
    const action = strategy.onArrowRight(ctx('a'));
    expect(action).toEqual({ kind: 'expand', id: 'a' });
    expect(ctrl.isExpanded('a')()).toBe(true);
  });

  it('ArrowRight on an expanded parent reports movedToChild', () => {
    const { ctrl, ctx, highlightByValue } = setup();
    ctrl.expand('a');
    const strategy = createW3CTreeStrategy();
    const action = strategy.onArrowRight(ctx('a'));
    expect(action).toEqual({ kind: 'movedToChild', id: 'a1' });
    expect(highlightByValue).toHaveBeenCalledWith({ id: 'a1' });
  });

  it('ArrowRight on a leaf is a noop', () => {
    const { ctx } = setup();
    const strategy = createW3CTreeStrategy();
    expect(strategy.onArrowRight(ctx('b'))).toEqual({ kind: 'noop' });
  });

  it('ArrowLeft collapses an expanded parent', () => {
    const { ctrl, ctx } = setup();
    ctrl.expand('a');
    const strategy = createW3CTreeStrategy();
    const action = strategy.onArrowLeft(ctx('a'));
    expect(action).toEqual({ kind: 'collapse', id: 'a' });
    expect(ctrl.isExpanded('a')()).toBe(false);
  });

  it('ArrowLeft on a leaf with a parent reports movedToParent', () => {
    const { ctrl, ctx, highlightByValue } = setup();
    ctrl.expand('a');
    const strategy = createW3CTreeStrategy();
    const action = strategy.onArrowLeft(ctx('a1'));
    expect(action).toEqual({ kind: 'movedToParent', id: 'a' });
    expect(highlightByValue).toHaveBeenCalledWith({ id: 'a' });
  });

  it('ArrowLeft on a root leaf is a noop', () => {
    const { ctx } = setup();
    const strategy = createW3CTreeStrategy();
    expect(strategy.onArrowLeft(ctx('b'))).toEqual({ kind: 'noop' });
  });
});
