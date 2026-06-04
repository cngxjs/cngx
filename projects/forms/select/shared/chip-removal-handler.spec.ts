import { signal, type WritableSignal } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  createChipRemovalHandler,
  type CngxChipRemovalHandler,
} from './chip-removal-handler';
import type {
  CngxSelectCommitAction,
  CngxSelectCommitMode,
} from './commit-action.types';
import type { CngxSelectOptionDef } from './option.model';
import type { CngxSelectCompareFn } from './select-core';

type T = string;

function opt(value: T, label = value): CngxSelectOptionDef<T> {
  return { value, label, disabled: false };
}

interface Harness {
  readonly values: WritableSignal<T[]>;
  readonly disabled: WritableSignal<boolean>;
  readonly compareWith: WritableSignal<CngxSelectCompareFn<T>>;
  readonly commitAction: WritableSignal<CngxSelectCommitAction<T[]> | null>;
  readonly commitMode: WritableSignal<CngxSelectCommitMode>;
  readonly beginCommitCalls: Array<{
    next: T[];
    previous: T[];
    item: CngxSelectOptionDef<T>;
  }>;
  readonly beforeCommitCalls: Array<{ previous: T[]; item: CngxSelectOptionDef<T> }>;
  readonly syncFinalizeCalls: Array<{ item: CngxSelectOptionDef<T>; previous: T[] }>;
  handler: CngxChipRemovalHandler<CngxSelectOptionDef<T>>;
}

function makeHarness(initial: T[] = ['a', 'b', 'c']): Harness {
  const values = signal<T[]>(initial);
  const disabled = signal(false);
  const compareWith = signal<CngxSelectCompareFn<T>>(
    (a, b) => Object.is(a, b),
  );
  const commitAction = signal<CngxSelectCommitAction<T[]> | null>(null);
  const commitMode = signal<CngxSelectCommitMode>('optimistic');
  const beginCommitCalls: Harness['beginCommitCalls'] = [];
  const beforeCommitCalls: Harness['beforeCommitCalls'] = [];
  const syncFinalizeCalls: Harness['syncFinalizeCalls'] = [];

  const handler = createChipRemovalHandler<T>({
    values,
    disabled,
    compareWith,
    commitAction,
    commitMode,
    beginCommit: (next, previous, item) =>
      beginCommitCalls.push({ next, previous, item }),
    onBeforeCommit: (previous, item) =>
      beforeCommitCalls.push({ previous, item }),
    onSyncFinalize: (item, previous) =>
      syncFinalizeCalls.push({ item, previous }),
  });

  return {
    values,
    disabled,
    compareWith,
    commitAction,
    commitMode,
    beginCommitCalls,
    beforeCommitCalls,
    syncFinalizeCalls,
    handler,
  };
}

describe('createChipRemovalHandler', () => {
  let h: Harness;

  beforeEach(() => {
    h = makeHarness();
  });

  describe('disabled guard', () => {
    it('is a no-op when disabled()=true', () => {
      h.disabled.set(true);
      h.handler.removeByValue(opt('b'));
      expect(h.values()).toEqual(['a', 'b', 'c']);
      expect(h.syncFinalizeCalls).toEqual([]);
      expect(h.beginCommitCalls).toEqual([]);
    });

    it('executes normally when disabled()=false', () => {
      h.handler.removeByValue(opt('b'));
      expect(h.values()).toEqual(['a', 'c']);
    });
  });

  describe('sync branch (no commit action)', () => {
    it('filters the value from values() using compareWith', () => {
      h.handler.removeByValue(opt('b'));
      expect(h.values()).toEqual(['a', 'c']);
    });

    it('passes a frozen previous-snapshot to onSyncFinalize', () => {
      h.handler.removeByValue(opt('b'));
      expect(h.syncFinalizeCalls.length).toBe(1);
      expect(h.syncFinalizeCalls[0].previous).toEqual(['a', 'b', 'c']);
      // previous must be a distinct array from the live values()
      expect(h.syncFinalizeCalls[0].previous).not.toBe(h.values());
    });

    it('does not invoke beginCommit or onBeforeCommit on the sync branch', () => {
      h.handler.removeByValue(opt('b'));
      expect(h.beginCommitCalls).toEqual([]);
      expect(h.beforeCommitCalls).toEqual([]);
    });

    it('respects a custom compareWith', () => {
      // Case-insensitive compare: "B" removes "b"
      h.compareWith.set((a, b) =>
        (a ?? '').toLowerCase() === (b ?? '').toLowerCase(),
      );
      h.handler.removeByValue(opt('B'));
      expect(h.values()).toEqual(['a', 'c']);
    });

    it('is a no-op when the value is not present in values()', () => {
      h.handler.removeByValue(opt('zzz'));
      expect(h.values()).toEqual(['a', 'b', 'c']);
      // onSyncFinalize still fires — the consumer's finalize callback
      // decides whether to emit a change. (Matches current variant
      // behaviour: removing a chip that isn't there is a no-op on the
      // data side but not a hard early-return in the factory.)
      expect(h.syncFinalizeCalls.length).toBe(1);
    });
  });

  describe('commit branch (commit action set)', () => {
    beforeEach(() => {
      // Factory doesn't invoke the action — only `beginCommit` callback is
      // dispatched. A no-op sync action (returning the next array) is fine.
      h.commitAction.set((next) => next as T[]);
    });

    it('optimistic mode: writes values() BEFORE beginCommit', () => {
      h.commitMode.set('optimistic');
      h.handler.removeByValue(opt('b'));
      expect(h.values()).toEqual(['a', 'c']);
      expect(h.beginCommitCalls.length).toBe(1);
      expect(h.beginCommitCalls[0].next).toEqual(['a', 'c']);
      expect(h.beginCommitCalls[0].previous).toEqual(['a', 'b', 'c']);
    });

    it('pessimistic mode: leaves values() untouched — consumer waits for success', () => {
      h.commitMode.set('pessimistic');
      h.handler.removeByValue(opt('b'));
      expect(h.values()).toEqual(['a', 'b', 'c']);
      expect(h.beginCommitCalls.length).toBe(1);
    });

    it('fires onBeforeCommit BEFORE beginCommit with the pre-write snapshot', () => {
      h.commitMode.set('optimistic');
      h.handler.removeByValue(opt('b'));
      expect(h.beforeCommitCalls.length).toBe(1);
      expect(h.beforeCommitCalls[0].previous).toEqual(['a', 'b', 'c']);
      // Since beforeCommit is called first, its snapshot should match
      // the pre-optimistic-write state.
    });

    it('does NOT fire onSyncFinalize on the commit branch', () => {
      h.handler.removeByValue(opt('b'));
      expect(h.syncFinalizeCalls).toEqual([]);
    });
  });

  describe('removeFor closure caching (WeakMap identity)', () => {
    it('returns the same function reference for repeated calls with the same item', () => {
      const item = opt('b');
      const fn1 = h.handler.removeFor(item);
      const fn2 = h.handler.removeFor(item);
      expect(fn1).toBe(fn2);
    });

    it('returns different references for different item references', () => {
      const item1 = opt('a');
      const item2 = opt('a'); // different reference, same value
      const fn1 = h.handler.removeFor(item1);
      const fn2 = h.handler.removeFor(item2);
      expect(fn1).not.toBe(fn2);
    });

    it('invoking the cached closure removes the chip', () => {
      const item = opt('b');
      const fn = h.handler.removeFor(item);
      fn();
      expect(h.values()).toEqual(['a', 'c']);
    });

    it('cached closure respects disabled-guard at call time', () => {
      const item = opt('b');
      const fn = h.handler.removeFor(item);
      h.disabled.set(true);
      fn();
      expect(h.values()).toEqual(['a', 'b', 'c']);
    });
  });

  describe('removeOverride (tree-select escape hatch)', () => {
    it('replaces the body but keeps the disabled-guard + WeakMap cache', () => {
      const calls: CngxSelectOptionDef<T>[] = [];
      const disabled = signal(false);
      const handler = createChipRemovalHandler<T>({
        disabled,
        removeOverride: (item) => calls.push(item),
      });
      handler.removeByValue(opt('x'));
      expect(calls).toEqual([opt('x')]);

      // Disabled-guard still applies.
      disabled.set(true);
      handler.removeByValue(opt('y'));
      expect(calls).toEqual([opt('x')]);
    });

    it('removeFor returns a stable closure even when removeOverride is set', () => {
      const handler = createChipRemovalHandler<T>({
        disabled: signal(false),
        removeOverride: () => {
          /* noop */
        },
      });
      const item = opt('a');
      const fn1 = handler.removeFor(item);
      const fn2 = handler.removeFor(item);
      expect(fn1).toBe(fn2);
    });

    it('throws at construction time when standard fields are missing AND removeOverride is absent', () => {
      expect(() =>
        createChipRemovalHandler<T>({
          disabled: signal(false),
        } as Parameters<typeof createChipRemovalHandler<T>>[0]),
      ).toThrow(/Missing required field/);
    });
  });

  describe('custom item shape (tree-select compatibility)', () => {
    it('accepts items with only .value — label/disabled not required', () => {
      interface TreeItem {
        readonly value: string;
      }
      const values = signal<string[]>(['x', 'y']);
      const handler = createChipRemovalHandler<string, TreeItem>({
        values,
        disabled: signal(false),
        compareWith: signal<CngxSelectCompareFn<string>>(
          (a, b) => a === b,
        ),
        commitAction: signal(null),
        commitMode: signal('optimistic'),
        beginCommit: () => {
          /* not used on sync path */
        },
        onSyncFinalize: () => {
          /* consumer emits change */
        },
      });
      handler.removeByValue({ value: 'x' });
      expect(values()).toEqual(['y']);
    });
  });
});
