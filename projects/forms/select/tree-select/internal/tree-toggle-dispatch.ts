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
import type { CngxSelectCore } from '../../shared/internal/select-core';
import type { CngxSelectOptionDef } from '../../shared/option.model';
import type { CngxTreeSelectChange } from '../tree-select.component';

/**
 * Change meta of one toggle or cascade-toggle dispatch.
 *
 * @internal
 */
export interface TreeToggleMeta<T> {
  readonly added: readonly T[];
  readonly removed: readonly T[];
  /** `null` for a stale value that is no longer in the tree. */
  readonly node: FlatTreeNode<T> | null;
  readonly action: 'toggle' | 'cascade-toggle';
  /** Option the announcement names; `null` speaks the count only. */
  readonly spoken: CngxSelectOptionDef<T> | null;
}

/**
 * Inputs of {@link createTreeToggleDispatch}. Signals and callbacks only, so
 * the factory needs no injection context.
 *
 * @internal
 */
export interface TreeToggleDispatchOptions<T> {
  readonly values: WritableSignal<T[]>;
  /**
   * Selection-boundary equality (`keyFn` first, else `compareWith`); also
   * reconciles the committed array.
   */
  readonly membersEqual: (a: T, b: T) => boolean;
  /**
   * Set key of the member identity (`keyFn`, or the value itself under a
   * reference `compareWith`); `null` when only a custom `compareWith` tells
   * members apart. Keyed membership is O(1) per lookup in the cascade walks.
   */
  readonly memberKey: Signal<((value: T) => unknown) | null>;
  readonly treeController: Pick<
    CngxTreeController<T>,
    'descendantsOfValue' | 'findByValue' | 'findById'
  >;
  /**
   * `[cascadeChildren]`. When on, a parent's membership is derived from its
   * descendants after every toggle, so ancestors follow a child toggle.
   */
  readonly cascade: Signal<boolean>;
  readonly commitAction: Signal<CngxSelectCommitAction<T[]> | null>;
  readonly commitMode: Signal<CngxSelectCommitMode>;
  readonly core: Pick<CngxSelectCore<T, T[]>, 'announce' | 'commitController' | 'claimCommitRetry'>;
  /**
   * The clear path stays on the shared array handler. Wrap it with
   * `core.routeRetryThrough` so a clear Retry reaches that handler.
   */
  readonly commitHandler: () => Pick<ArrayCommitHandler<T>, 'beginClear'>;
  readonly emitChange: (change: Omit<CngxTreeSelectChange<T>, 'source'>) => void;
  readonly emitCleared: () => void;
  readonly emitState: (status: AsyncStatus) => void;
  readonly emitCommitError: (err: unknown) => void;
  readonly announceCommitError: (err: unknown, rolledBack?: boolean) => void;
}

/**
 * Tree-select selection mutations: single toggle, cascade toggle, removal of
 * one value (in tree or stale) and clear-all, each with the sync, optimistic
 * and pessimistic commit paths and the Retry replay.
 *
 * @internal
 */
export interface TreeToggleDispatch<T> {
  /** Flip one node; in cascade mode its ancestors are re-derived. */
  singleToggle(node: FlatTreeNode<T>): void;
  /**
   * Select a node and every non-disabled descendant, or deselect them all
   * when every one of them is already selected. A mixed subtree selects all
   * (APG tri-state). Ancestors are re-derived afterwards.
   */
  cascadeToggle(node: FlatTreeNode<T>): void;
  /** Remove one value: a tree value toggles off, a stale value is stripped. */
  removeValue(value: T, label: string): void;
  /** Clear the whole selection. */
  clearAll(): void;
  /** Replay the last failed tree commit this dispatch started. */
  retryLast(): void;
}

/** @internal */
export function createTreeToggleDispatch<T>(
  opts: TreeToggleDispatchOptions<T>,
): TreeToggleDispatch<T> {
  const { values, membersEqual } = opts;
  const ledger = commitLedgerFor<T[], T>(opts.core.commitController);
  const retryLast = (): void => ledger.retry();
  const owner = { retryLast };

  const snapshot = (): T[] => untracked(() => [...values()]);

  const announceToggle = (meta: TreeToggleMeta<T>, count: number): void => {
    opts.core.announce(meta.spoken, meta.added.length > 0 ? 'added' : 'removed', count, true);
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

    if (opts.commitMode() === 'optimistic') {
      values.set(next);
    }
    opts.core.claimCommitRetry(owner);
    ledger.beginMembers<T[]>({
      kind: 'tree',
      next,
      previous,
      meta,
      action,
      commitAction: opts.commitAction,
      value: values,
      same: (a, b) => sameArrayContents(a, b, membersEqual),
      copy: (v) => [...v],
      commitMode: opts.commitMode,
      onStateChange: opts.emitState,
      onSuccess: (finalValues, confirmedPrevious) => {
        emitToggle(finalValues, confirmedPrevious, meta);
        announceToggle(meta, finalValues.length);
      },
      onError: opts.emitCommitError,
      announceError: opts.announceCommitError,
    });
  };

  const isIn = (set: readonly T[], value: T): boolean => set.some((v) => membersEqual(v, value));

  // Built once per dispatch, so a deep cascade does not rescan the selection
  // per descendant and per ancestor.
  const indexOf = (members: readonly T[]): MemberIndex<T> => {
    const key = untracked(opts.memberKey);
    if (key) {
      const keys = new Set(members.map(key));
      return {
        has: (v) => keys.has(key(v)),
        add: (v) => keys.add(key(v)),
        delete: (v) => keys.delete(key(v)),
      };
    }
    let list = [...members];
    return {
      has: (v) => isIn(list, v),
      add: (v) => list.push(v),
      delete: (v) => {
        list = list.filter((m) => !membersEqual(m, v));
      },
    };
  };

  const dedup = (arr: readonly T[]): T[] => {
    const seen = indexOf([]);
    return arr.filter((v) => {
      if (seen.has(v)) {
        return false;
      }
      seen.add(v);
      return true;
    });
  };

  const enabledDescendants = (value: T): T[] => {
    const tc = opts.treeController;
    return tc.descendantsOfValue(value).filter((v) => tc.findByValue(v)?.disabled !== true);
  };

  // Parent membership is derived, not stored: walking nearest-first, an
  // enabled ancestor is selected iff every enabled descendant is. A disabled
  // ancestor keeps its state, like a disabled descendant in a cascade.
  const deriveAncestors = (set: T[], node: FlatTreeNode<T>): T[] => {
    let out = set;
    const index = indexOf(out);
    for (const id of [...node.parentIds].reverse()) {
      const ancestor = opts.treeController.findById(id);
      if (!ancestor || ancestor.disabled) {
        continue;
      }
      const full = enabledDescendants(ancestor.value).every((v) => index.has(v));
      const selected = index.has(ancestor.value);
      if (full && !selected) {
        out = [...out, ancestor.value];
        index.add(ancestor.value);
      } else if (!full && selected) {
        out = out.filter((v) => !membersEqual(v, ancestor.value));
        index.delete(ancestor.value);
      }
    }
    return out;
  };

  const dispatchDiff = (
    next: T[],
    previous: T[],
    node: FlatTreeNode<T>,
    action: TreeToggleMeta<T>['action'],
  ): void => {
    const before = indexOf(previous);
    const after = indexOf(next);
    // Single toggle names the node; a cascade speaks the count only.
    const named = action === 'toggle' && node.label;
    dispatch(next, previous, {
      added: next.filter((v) => !before.has(v)),
      removed: previous.filter((v) => !after.has(v)),
      node,
      action,
      spoken: named ? { value: node.value, label: node.label } : null,
    });
  };

  const singleToggle = (node: FlatTreeNode<T>): void => {
    const value = node.value;
    const previous = snapshot();
    const toggled = isIn(previous, value)
      ? previous.filter((v) => !membersEqual(v, value))
      : [...previous, value];
    const next = opts.cascade() ? deriveAncestors(toggled, node) : toggled;
    dispatchDiff(next, previous, node, 'toggle');
  };

  const cascadeToggle = (node: FlatTreeNode<T>): void => {
    // A disabled descendant keeps whatever state it had: the user cannot
    // reverse a change on a row they cannot activate.
    const allValues = [node.value, ...enabledDescendants(node.value)];
    const previous = snapshot();
    const selected = indexOf(previous);
    const subtree = indexOf(allValues);
    const fullySelected = allValues.every((a) => selected.has(a));
    const toggled = fullySelected
      ? previous.filter((v) => !subtree.has(v))
      : dedup([...previous, ...allValues]);
    dispatchDiff(deriveAncestors(toggled, node), previous, node, 'cascade-toggle');
  };

  const removeValue = (value: T, label: string): void => {
    const node = opts.treeController.findByValue(value);
    if (node) {
      singleToggle(node);
      return;
    }
    // Stale selection (value not in tree): strip it without the tree, but
    // through the same commit path as every other tree mutation.
    const previous = snapshot();
    const next = previous.filter((v) => !membersEqual(v, value));
    dispatch(next, previous, {
      added: [],
      removed: [value],
      node: null,
      action: 'toggle',
      spoken: { value, label },
    });
  };

  const clearAll = (): void => {
    const previous = snapshot();
    if (previous.length === 0) {
      return;
    }
    const action = opts.commitAction();
    if (action) {
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
    retryLast,
  };
}

interface MemberIndex<T> {
  has(value: T): boolean;
  add(value: T): void;
  delete(value: T): void;
}
