import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { createManualState, type ManualAsyncState } from '@cngx/common/data';
import type { CngxAsyncState } from '@cngx/core/utils';

import type { CngxSelectOptionsInput } from '../option.model';
import { createOptionsStateView } from './options-state-view';

interface Node {
  readonly value: string;
  readonly children?: readonly Node[];
}

function setup() {
  const tree = TestBed.runInInjectionContext(() => createManualState<readonly Node[]>());
  const state = signal<CngxAsyncState<unknown> | null>(null);
  const options = signal<CngxSelectOptionsInput<string>>([]);
  const view = createOptionsStateView(state, options);
  return { tree, state, options, view };
}

describe('createOptionsStateView', () => {
  it('is null while no state is bound', () => {
    const { view } = setup();
    expect(view()).toBeNull();
  });

  it('forwards every status signal of the bound state by reference', () => {
    const { tree, state, view } = setup();
    state.set(tree);
    const v = view()!;
    expect(v.status).toBe(tree.status);
    expect(v.error).toBe(tree.error);
    expect(v.progress).toBe(tree.progress);
    expect(v.isLoading).toBe(tree.isLoading);
    expect(v.isPending).toBe(tree.isPending);
    expect(v.isRefreshing).toBe(tree.isRefreshing);
    expect(v.isBusy).toBe(tree.isBusy);
    expect(v.isFirstLoad).toBe(tree.isFirstLoad);
    expect(v.isSettled).toBe(tree.isSettled);
    expect(v.lastUpdated).toBe(tree.lastUpdated);
  });

  it('maps data, hasData and isEmpty onto the flat option list, never the tree data', () => {
    const { tree, state, options, view } = setup();
    state.set(tree);
    (tree as ManualAsyncState<readonly Node[]>).setSuccess([{ value: 'a', children: [] }]);
    expect(view()!.data()).toEqual([]);
    expect(view()!.isEmpty()).toBe(true);
    expect(view()!.hasData()).toBe(false);

    options.set([{ value: 'a', label: 'A' }]);
    expect(view()!.data()).toEqual([{ value: 'a', label: 'A' }]);
    expect(view()!.isEmpty()).toBe(false);
    expect(view()!.hasData()).toBe(true);
  });

  it('keeps the view reference until the state identity changes', () => {
    const { tree, state, options, view } = setup();
    state.set(tree);
    const first = view();
    options.set([{ value: 'a', label: 'A' }]);
    tree.set('loading');
    expect(view()).toBe(first);

    const other = TestBed.runInInjectionContext(() => createManualState<readonly Node[]>());
    state.set(other);
    expect(view()).not.toBe(first);
    expect(view()!.status).toBe(other.status);
  });
});
