import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createTreeController } from '@cngx/common/interactive';
import type { CngxTreeNode, FlatTreeNode } from '@cngx/utils';
import { describe, expect, it, vi } from 'vitest';

import type {
  CngxSelectCommitAction,
  CngxSelectCommitMode,
} from '../../shared/commit-action.types';
import type { CngxTreeSelectChange } from '../tree-select.component';
import { createTreeToggleDispatch } from './tree-toggle-dispatch';

interface BeginCall {
  readonly next: string[] | undefined;
  readonly previous: string[] | undefined;
  readonly onSuccess: (committed: string[] | undefined) => void;
  readonly onError: (err: unknown, previous: string[] | undefined) => void;
}

function nodes(): CngxTreeNode<string>[] {
  return [
    {
      value: 'p',
      children: [{ value: 'c1' }, { value: 'c2', disabled: true }, { value: 'c3' }],
    },
    { value: 'q' },
    {
      value: 'g',
      children: [{ value: 'm', children: [{ value: 'm1' }, { value: 'm2' }] }, { value: 'n' }],
    },
  ];
}

function setup(
  opts: {
    commit?: boolean;
    mode?: CngxSelectCommitMode;
    initial?: string[];
    cascade?: boolean;
    keyed?: boolean;
  } = {},
) {
  const values = signal<string[]>(opts.initial ?? []);
  const treeController = TestBed.runInInjectionContext(() =>
    createTreeController<string>({ nodes: signal(nodes()), nodeIdFn: (v) => v }),
  );
  const begins: BeginCall[] = [];
  const action = (() => undefined) as unknown as CngxSelectCommitAction<string[]>;
  const changes: Omit<CngxTreeSelectChange<string>, 'source'>[] = [];
  const announce = vi.fn();
  const beginClear = vi.fn();
  const claimCommitRetry = vi.fn();
  const states: string[] = [];
  const errors: unknown[] = [];
  const cleared = vi.fn();
  const dispatch = createTreeToggleDispatch<string>({
    values,
    membersEqual: Object.is,
    memberKey: signal(opts.keyed === false ? null : (v: string) => v),
    treeController,
    cascade: signal(opts.cascade ?? false),
    commitAction: signal(opts.commit ? action : null),
    commitMode: signal(opts.mode ?? 'optimistic'),
    core: {
      announce,
      claimCommitRetry,
      commitController: {
        isCommitting: signal(false),
        begin: (
          _runner: unknown,
          next: string[] | undefined,
          previous: string[] | undefined,
          handlers: Pick<BeginCall, 'onSuccess' | 'onError'>,
        ) =>
          begins.push({ next, previous, onSuccess: handlers.onSuccess, onError: handlers.onError }),
      } as never,
    },
    commitHandler: () => ({ beginClear }),
    emitChange: (c) => changes.push(c),
    emitCleared: cleared,
    emitState: (s) => states.push(s),
    emitCommitError: (e) => errors.push(e),
    announceCommitError: vi.fn(),
  });
  const node = (value: string): FlatTreeNode<string> => treeController.findByValue(value)!;
  return {
    values,
    dispatch,
    node,
    begins,
    changes,
    announce,
    beginClear,
    claimCommitRetry,
    states,
    errors,
    cleared,
  };
}

describe('createTreeToggleDispatch', () => {
  it('toggles one node on and off and announces its label', () => {
    const t = setup();
    t.dispatch.singleToggle(t.node('q'));
    expect(t.values()).toEqual(['q']);
    expect(t.changes[0]).toMatchObject({ added: ['q'], removed: [], action: 'toggle' });
    expect(t.announce).toHaveBeenLastCalledWith({ value: 'q', label: 'q' }, 'added', 1, true);
    t.dispatch.singleToggle(t.node('q'));
    expect(t.values()).toEqual([]);
    expect(t.changes[1]).toMatchObject({ added: [], removed: ['q'] });
  });

  it('cascades a parent over its enabled descendants; a disabled one keeps its state', () => {
    const t = setup({ initial: ['c2'] });
    t.dispatch.cascadeToggle(t.node('p'));
    expect([...t.values()].sort()).toEqual(['c1', 'c2', 'c3', 'p']);
    expect(t.changes[0]).toMatchObject({ action: 'cascade-toggle', added: ['p', 'c1', 'c3'] });
    expect(t.announce).toHaveBeenLastCalledWith(null, 'added', 4, true);
    t.dispatch.cascadeToggle(t.node('p'));
    expect(t.values()).toEqual(['c2']);
  });

  it('a click on a mixed parent selects every enabled descendant (A10)', () => {
    const t = setup({ cascade: true, initial: ['p', 'c1', 'c3'] });
    t.dispatch.singleToggle(t.node('c1'));
    expect([...t.values()].sort()).toEqual(['c3']);
    expect(t.changes[0]).toMatchObject({ action: 'toggle', removed: ['p', 'c1'], added: [] });
    t.dispatch.cascadeToggle(t.node('p'));
    expect([...t.values()].sort()).toEqual(['c1', 'c3', 'p']);
    expect(t.changes[1]).toMatchObject({ action: 'cascade-toggle', added: ['p', 'c1'] });
  });

  it('a parent in the set with an unselected child counts as mixed, not selected', () => {
    const t = setup({ cascade: true, initial: ['p', 'c3'] });
    t.dispatch.cascadeToggle(t.node('p'));
    expect([...t.values()].sort()).toEqual(['c1', 'c3', 'p']);
  });

  it('selecting every child one by one derives the ancestors in cascade mode', () => {
    const t = setup({ cascade: true, initial: ['n'] });
    t.dispatch.singleToggle(t.node('m1'));
    expect([...t.values()].sort()).toEqual(['m1', 'n']);
    t.dispatch.singleToggle(t.node('m2'));
    expect([...t.values()].sort()).toEqual(['g', 'm', 'm1', 'm2', 'n']);
    expect(t.changes[1]).toMatchObject({ added: ['m2', 'm', 'g'], removed: [] });
    t.dispatch.singleToggle(t.node('n'));
    expect([...t.values()].sort()).toEqual(['m', 'm1', 'm2']);
  });

  it('a cascade on a nested parent re-derives the ancestors above it', () => {
    const t = setup({ cascade: true, initial: ['n'] });
    t.dispatch.cascadeToggle(t.node('m'));
    expect([...t.values()].sort()).toEqual(['g', 'm', 'm1', 'm2', 'n']);
    t.dispatch.cascadeToggle(t.node('m'));
    expect(t.values()).toEqual(['n']);
  });

  it.each([
    ['a keyed', true],
    ['a compareWith-only', false],
  ])('a click on a mixed grandparent selects the whole subtree with %s identity', (_k, keyed) => {
    const t = setup({ cascade: true, initial: ['m1'], keyed });
    t.dispatch.cascadeToggle(t.node('g'));
    expect([...t.values()].sort()).toEqual(['g', 'm', 'm1', 'm2', 'n']);
    expect(t.changes[0]).toMatchObject({ added: ['g', 'm', 'm2', 'n'], removed: [] });
    t.dispatch.singleToggle(t.node('m2'));
    expect([...t.values()].sort()).toEqual(['m1', 'n']);
    expect(t.changes[1]).toMatchObject({ added: [], removed: ['g', 'm', 'm2'] });
  });

  it('a child toggle leaves ancestors alone without cascade', () => {
    const t = setup({ initial: ['p', 'c1', 'c3'] });
    t.dispatch.singleToggle(t.node('c1'));
    expect([...t.values()].sort()).toEqual(['c3', 'p']);
  });

  it('strips a stale value and toggles an in-tree one on removal', () => {
    const t = setup({ initial: ['gone', 'q'] });
    t.dispatch.removeValue('gone', 'Gone');
    expect(t.values()).toEqual(['q']);
    expect(t.changes[0]).toMatchObject({ node: null, removed: ['gone'] });
    t.dispatch.removeValue('q', 'q');
    expect(t.values()).toEqual([]);
  });

  it('clears without a commit action and emits cleared', () => {
    const t = setup({ initial: ['q', 'p'] });
    t.dispatch.clearAll();
    expect(t.values()).toEqual([]);
    expect(t.cleared).toHaveBeenCalledTimes(1);
    expect(t.changes[0]).toMatchObject({ action: 'clear', removed: ['q', 'p'] });
  });

  it('hands a committed clear to the array handler', () => {
    const t = setup({ commit: true, initial: ['q'] });
    t.dispatch.clearAll();
    expect(t.values()).toEqual([]);
    expect(t.beginClear).toHaveBeenCalledTimes(1);
  });

  it('claims the Retry before a tree commit, never for a clear or a sync toggle', () => {
    const sync = setup();
    sync.dispatch.singleToggle(sync.node('q'));
    expect(sync.claimCommitRetry).not.toHaveBeenCalled();
    const t = setup({ commit: true, initial: ['q'] });
    t.dispatch.clearAll();
    expect(t.claimCommitRetry).not.toHaveBeenCalled();
    t.dispatch.singleToggle(t.node('q'));
    expect(t.claimCommitRetry).toHaveBeenCalledTimes(1);
    expect(t.claimCommitRetry.mock.calls[0][0].retryLast).toBe(t.dispatch.retryLast);
  });

  it('optimistic commit emits and announces only once the commit succeeds', () => {
    const t = setup({ commit: true });
    t.dispatch.singleToggle(t.node('q'));
    expect(t.values()).toEqual(['q']);
    expect(t.changes).toHaveLength(0);
    expect(t.announce).not.toHaveBeenCalled();
    t.begins[0].onSuccess(undefined);
    expect(t.changes).toEqual([
      expect.objectContaining({ values: ['q'], previousValues: [], added: ['q'] }),
    ]);
    expect(t.announce).toHaveBeenLastCalledWith({ value: 'q', label: 'q' }, 'added', 1, true);
  });

  it('optimistic commit that fails emits no selection change', () => {
    const t = setup({ commit: true });
    t.dispatch.singleToggle(t.node('q'));
    t.begins[0].onError(new Error('x'), []);
    expect(t.values()).toEqual([]);
    expect(t.changes).toHaveLength(0);
    expect(t.announce).not.toHaveBeenCalled();
  });

  it('optimistic commit writes first and rolls back on error, retry replays', () => {
    const t = setup({ commit: true });
    t.dispatch.singleToggle(t.node('q'));
    expect(t.values()).toEqual(['q']);
    expect(t.states).toEqual(['pending']);
    t.begins[0].onError(new Error('x'), []);
    expect(t.values()).toEqual([]);
    expect(t.errors).toHaveLength(1);
    t.dispatch.retryLast();
    expect(t.begins).toHaveLength(2);
    t.begins[1].onSuccess(undefined);
    expect(t.values()).toEqual(['q']);
  });

  it('pessimistic commit writes and emits only on success', () => {
    const t = setup({ commit: true, mode: 'pessimistic' });
    t.dispatch.singleToggle(t.node('q'));
    expect(t.values()).toEqual([]);
    expect(t.changes).toHaveLength(0);
    t.begins[0].onSuccess(['q']);
    expect(t.values()).toEqual(['q']);
    expect(t.changes).toHaveLength(1);
  });
});
