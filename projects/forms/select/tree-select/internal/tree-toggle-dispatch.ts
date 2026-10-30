import { untracked, type Signal, type WritableSignal } from '@angular/core';
import type { AsyncStatus } from '@cngx/core/utils';
import type { CngxTreeController } from '@cngx/common/interactive';
import type { FlatTreeNode } from '@cngx/utils';

import type { ArrayCommitHandler } from '../../shared/array-commit-handler';
import type {
  CngxSelectCommitAction,
  CngxSelectCommitMode,
} from '../../shared/commit-action.types';
import { commitLedgerFor } from '../../shared/internal/commit-ledger';
import { sameArrayContents } from '../../shared/internal/compare';
import type { CngxSelectCompareFn, CngxSelectCore } from '../../shared/internal/select-core';
import type { CngxTreeSelectChange } from '../tree-select.component';

/**
 * Change meta of one toggle or cascade-toggle dispatch.
 *
 * @internal
 */
export interface TreeToggleMeta<T> {
  readonly added: readonly T[];
  readonly removed: readonly T[];
  readonly node: FlatTreeNode<T>;
  readonly action: 'toggle' | 'cascade-toggle';
}

/**
 * Inputs of {@link createTreeToggleDispatch}. Signals and callbacks only, so
 * the factory needs no injection context.
 *
 * @internal
 */
export interface TreeToggleDispatchOptions<T> {
  readonly values: WritableSignal<T[]>;
  /** Selection-boundary equality (`keyFn` first, else `compareWith`). */
  readonly membersEqual: (a: T, b: T) => boolean;
  /** Reconciliation equality of the committed array. */
  readonly compareWith: Signal<CngxSelectCompareFn<T>>;
  readonly treeController: Pick<CngxTreeController<T>, 'descendantsOfValue' | 'findByValue'>;
  readonly commitAction: Signal<CngxSelectCommitAction<T[]> | null>;
  readonly commitMode: Signal<CngxSelectCommitMode>;
  readonly core: Pick<CngxSelectCore<T, T[]>, 'announce' | 'commitController'>;
  /** The clear path stays on the shared array handler (ledger kind `clear`). */
  readonly commitHandler: () => Pick<ArrayCommitHandler<T>, 'beginClear'>;
  readonly emitChange: (change: Omit<CngxTreeSelectChange<T>, 'source'>) => void;
  readonly emitCleared: () => void;
  readonly emitState: (status: AsyncStatus) => void;
  readonly emitCommitError: (err: unknown) => void;
  readonly announceCommitError: (err: unknown) => void;
}

/**
 * Tree-select selection mutations: single toggle, cascade toggle, removal of
 * one value (in tree or stale) and clear-all, each with the sync, optimistic
 * and pessimistic commit paths and the Retry replay.
 *
 * @internal
 */
export interface TreeToggleDispatch<T> {
  /** Flip one node. */
  singleToggle(node: FlatTreeNode<T>): void;
  /** Flip a node and every non-disabled descendant in one change. */
  cascadeToggle(node: FlatTreeNode<T>): void;
  /** Remove one value: a tree value toggles off, a stale value is stripped. */
  removeValue(value: T, label: string): void;
  /** Clear the whole selection. */
  clearAll(): void;
  /** Replay the last commit (commit-error Retry). */
  retryLast(): void;
  /** Rollback target of the shared array handler. */
  lastCommitted(): T[];
}

/** @internal */
export function createTreeToggleDispatch<T>(
  opts: TreeToggleDispatchOptions<T>,
): TreeToggleDispatch<T> {
  const { values, membersEqual } = opts;
  const ledger = commitLedgerFor<T[], T>(opts.core.commitController);
  let lastCommittedValues: T[] = untracked(() => [...values()]);

  const snapshot = (): T[] => untracked(() => [...values()]);

  const announceToggle = (meta: TreeToggleMeta<T>, count: number): void => {
    // Single toggle names the node; a cascade speaks the count only.
    const label = meta.action === 'toggle' ? meta.node.label : null;
    opts.core.announce(
      label ? { value: meta.node.value, label } : null,
      meta.added.length > 0 ? 'added' : 'removed',
      count,
      true,
    );
  };

  const emitToggle = (next: T[], previous: T[], meta: TreeToggleMeta<T>): void => {
    opts.emitChange({
      values: next,
      previousValues: previous,
      added: meta.added,
      removed: meta.removed,
      node: meta.node,
      action: meta.action,
    });
  };

  // Bypasses `ArrayCommitHandler.beginToggle` (its option-def shape does not
  // fit the tree) and records kind `tree` on the shared commit ledger. The
  // change event and the announcement wait for success in both modes, so a
  // rejected commit never reports a selection it rolls back.
  const dispatch = (next: T[], previous: T[], meta: TreeToggleMeta<T>): void => {
    const action = opts.commitAction();
    if (!action) {
      values.set(next);
      emitToggle(next, previous, meta);
      announceToggle(meta, next.length);
      return;
    }

    lastCommittedValues = previous;
    if (opts.commitMode() === 'optimistic') {
      values.set(next);
    }
    ledger.beginMembers<T[]>({
      kind: 'tree',
      next,
      previous,
      meta,
      action,
      commitAction: opts.commitAction,
      value: values,
      same: (a, b) => sameArrayContents(a, b, opts.compareWith()),
      copy: (v) => [...v],
      commitMode: opts.commitMode,
      onStateChange: opts.emitState,
      onSuccess: (finalValues) => {
        lastCommittedValues = [...finalValues];
        emitToggle(finalValues, previous, meta);
        announceToggle(meta, finalValues.length);
      },
      onError: opts.emitCommitError,
      announceError: opts.announceCommitError,
    });
  };

  const singleToggle = (node: FlatTreeNode<T>): void => {
    const value = node.value;
    const previous = snapshot();
    const wasSelected = previous.some((v) => membersEqual(v, value));
    const next = wasSelected
      ? previous.filter((v) => !membersEqual(v, value))
      : [...previous, value];
    dispatch(next, previous, {
      added: wasSelected ? [] : [value],
      removed: wasSelected ? [value] : [],
      node,
      action: 'toggle',
    });
  };

  const cascadeToggle = (node: FlatTreeNode<T>): void => {
    // A disabled descendant keeps whatever state it had: the user cannot
    // reverse a change on a row they cannot activate.
    const tc = opts.treeController;
    const descendants = tc
      .descendantsOfValue(node.value)
      .filter((v) => tc.findByValue(v)?.disabled !== true);
    const allValues = [node.value, ...descendants];
    const previous = snapshot();
    const parentSelected = previous.some((v) => membersEqual(v, node.value));
    const isPrevious = (a: T): boolean => previous.some((v) => membersEqual(v, a));

    const next = parentSelected
      ? previous.filter((v) => !allValues.some((a) => membersEqual(v, a)))
      : dedup([...previous, ...allValues], membersEqual);
    dispatch(next, previous, {
      added: parentSelected ? [] : allValues.filter((a) => !isPrevious(a)),
      removed: parentSelected ? allValues.filter(isPrevious) : [],
      node,
      action: 'cascade-toggle',
    });
  };

  const removeValue = (value: T, label: string): void => {
    const node = opts.treeController.findByValue(value);
    if (node) {
      singleToggle(node);
      return;
    }
    // Stale selection (value not in tree): strip it without the tree.
    const previous = snapshot();
    const next = previous.filter((v) => !membersEqual(v, value));
    values.set(next);
    opts.emitChange({
      values: next,
      previousValues: previous,
      added: [],
      removed: [value],
      node: null,
      action: 'toggle',
    });
    opts.core.announce({ value, label }, 'removed', next.length, true);
  };

  const clearAll = (): void => {
    const previous = snapshot();
    if (previous.length === 0) {
      return;
    }
    const action = opts.commitAction();
    if (action) {
      lastCommittedValues = previous;
      if (opts.commitMode() === 'optimistic') {
        values.set([]);
      }
      opts.commitHandler().beginClear(previous, action);
      return;
    }
    values.set([]);
    opts.emitCleared();
    opts.emitChange({
      values: [],
      previousValues: previous,
      added: [],
      removed: previous,
      node: null,
      action: 'clear',
    });
    opts.core.announce(null, 'removed', 0, true);
  };

  return {
    singleToggle,
    cascadeToggle,
    removeValue,
    clearAll,
    retryLast: () => ledger.retry(),
    lastCommitted: () => lastCommittedValues,
  };
}

function dedup<T>(arr: readonly T[], eq: (a: T, b: T) => boolean): T[] {
  const out: T[] = [];
  for (const v of arr) {
    if (!out.some((o) => eq(o, v))) {
      out.push(v);
    }
  }
  return out;
}
