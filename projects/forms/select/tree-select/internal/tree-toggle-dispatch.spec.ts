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
  ];
}

function setup(opts: { commit?: boolean; mode?: CngxSelectCommitMode; initial?: string[] } = {}) {
  const values = signal<string[]>(opts.initial ?? []);
  const treeController = TestBed.runInInjectionContext(() =>
    createTreeController<string>({ nodes: signal(nodes()), nodeIdFn: (v) => v }),
  );
  const begins: BeginCall[] = [];
  const action = (() => undefined) as unknown as CngxSelectCommitAction<string[]>;
  const changes: Omit<CngxTreeSelectChange<string>, 'source'>[] = [];
  const announce = vi.fn();
  const beginClear = vi.fn();
  const retryLast = vi.fn();
  const states: string[] = [];
  const errors: unknown[] = [];
  const cleared = vi.fn();
  const dispatch = createTreeToggleDispatch<string>({
    values,
    membersEqual: Object.is,
    compareWith: signal(Object.is),
    treeController,
    commitAction: signal(opts.commit ? action : null),
    commitMode: signal(opts.mode ?? 'optimistic'),
    core: {
      announce,
      commitController: {
        begin: (
          _runner: unknown,
          next: string[] | undefined,
          previous: string[] | undefined,
          handlers: Pick<BeginCall, 'onSuccess' | 'onError'>,
        ) =>
          begins.push({ next, previous, onSuccess: handlers.onSuccess, onError: handlers.onError }),
      } as never,
    },
    commitHandler: () => ({ beginClear, retryLast }),
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
    retryLast,
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

  it('hands a committed clear to the array handler and replays it on retry', () => {
    const t = setup({ commit: true, initial: ['q'] });
    t.dispatch.clearAll();
    expect(t.values()).toEqual([]);
    expect(t.beginClear).toHaveBeenCalledTimes(1);
    expect(t.dispatch.lastCommitted()).toEqual(['q']);
    t.dispatch.retryLast();
    expect(t.retryLast).toHaveBeenCalledTimes(1);
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
    expect(t.dispatch.lastCommitted()).toEqual(['q']);
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
