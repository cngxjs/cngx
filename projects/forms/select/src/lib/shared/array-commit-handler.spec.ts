import { signal, type WritableSignal } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';

import { createArrayCommitHandler } from './array-commit-handler';
import { createCommitController } from './commit-controller';
import type { CngxCommitController } from './commit-controller';
import type {
  CngxSelectCommitAction,
  CngxSelectCommitMode,
} from './commit-action.types';
import type { CngxSelectOptionDef } from './option.model';
import type { CngxSelectCompareFn, CngxSelectCore } from './select-core';

type T = string;

function opt(value: T, label = value): CngxSelectOptionDef<T> {
  return { value, label, disabled: false };
}

interface CoreMock {
  readonly commitController: CngxCommitController<T[]>;
  readonly togglingOption: WritableSignal<CngxSelectOptionDef<T> | null>;
  readonly announceCalls: Array<{
    option: CngxSelectOptionDef<T> | null;
    action: 'added' | 'removed';
    count: number;
    assertive: boolean;
  }>;
  announce(
    option: CngxSelectOptionDef<T> | null,
    action: 'added' | 'removed',
    count: number,
    assertive: boolean,
  ): void;
}

function makeCore(): CoreMock {
  const togglingOption = signal<CngxSelectOptionDef<T> | null>(null);
  const announceCalls: CoreMock['announceCalls'] = [];
  return {
    commitController: createCommitController<T[]>(),
    togglingOption,
    announceCalls,
    announce(option, action, count, assertive): void {
      announceCalls.push({ option, action, count, assertive });
    },
  };
}

interface Harness {
  readonly values: WritableSignal<T[]>;
  readonly compareWith: WritableSignal<CngxSelectCompareFn<T>>;
  readonly commitMode: WritableSignal<CngxSelectCommitMode>;
  readonly commitAction: WritableSignal<CngxSelectCommitAction<T[]> | null>;
  readonly coreMock: CoreMock;
  readonly stateLog: string[];
  readonly errorLog: unknown[];
  readonly toggleFinalizeLog: Array<[CngxSelectOptionDef<T>, boolean]>;
  readonly clearFinalizeLog: Array<[T[], T[]]>;
  handler: ReturnType<typeof createArrayCommitHandler<T>>;
  lastCommitted: T[];
}

function makeHarness(initial: T[] = []): Harness {
  const values = signal<T[]>(initial);
  const compareWith = signal<CngxSelectCompareFn<T>>((a, b) => Object.is(a, b));
  const commitMode = signal<CngxSelectCommitMode>('optimistic');
  const commitAction = signal<CngxSelectCommitAction<T[]> | null>(null);
  const coreMock = makeCore();
  const stateLog: string[] = [];
  const errorLog: unknown[] = [];
  const toggleFinalizeLog: Harness['toggleFinalizeLog'] = [];
  const clearFinalizeLog: Harness['clearFinalizeLog'] = [];
  const harness: Harness = {
    values,
    compareWith,
    commitMode,
    commitAction,
    coreMock,
    stateLog,
    errorLog,
    toggleFinalizeLog,
    clearFinalizeLog,
    handler: null as unknown as ReturnType<typeof createArrayCommitHandler<T>>,
    lastCommitted: [...initial],
  };
  harness.handler = createArrayCommitHandler<T>({
    values,
    compareWith,
    commitMode,
    core: coreMock as unknown as CngxSelectCore<T, T[]>,
    commitAction,
    getLastCommitted: () => harness.lastCommitted,
    onToggleFinalize: (option, isNowSelected) =>
      toggleFinalizeLog.push([option, isNowSelected]),
    onClearFinalize: (previous, finalValues) =>
      clearFinalizeLog.push([previous, finalValues]),
    onStateChange: (s) => stateLog.push(s),
    onError: (err) => errorLog.push(err),
  });
  return harness;
}

describe('createArrayCommitHandler', () => {
  let h: Harness;

  beforeEach(() => {
    h = makeHarness(['a']);
  });

  describe('beginToggle — success path', () => {
    it('emits pending → success and reconciles values', () => {
      const action: CngxSelectCommitAction<T[]> = (next) => next;
      h.handler.beginToggle(['a', 'b'], ['a'], opt('b'), action);
      expect(h.stateLog).toEqual(['pending', 'success']);
      expect(h.values()).toEqual(['a', 'b']);
    });

    it('dispatches onToggleFinalize with isNowSelected=true when the option is in the final list', () => {
      const action: CngxSelectCommitAction<T[]> = (next) => next;
      h.coreMock.togglingOption.set(opt('b'));
      h.handler.beginToggle(['a', 'b'], ['a'], opt('b'), action);
      expect(h.toggleFinalizeLog).toEqual([[opt('b'), true]]);
      expect(h.coreMock.togglingOption()).toBeNull();
    });

    it('dispatches onToggleFinalize with isNowSelected=false when the option was removed', () => {
      h.values.set(['a']);
      const action: CngxSelectCommitAction<T[]> = (next) => next;
      h.handler.beginToggle([], ['a'], opt('a'), action);
      expect(h.toggleFinalizeLog).toEqual([[opt('a'), false]]);
    });

    it('respects the server-returned committed payload over the intended one', () => {
      const action: CngxSelectCommitAction<T[]> = () => ['server-owned'];
      h.handler.beginToggle(['anything'], [], opt('anything'), action);
      expect(h.values()).toEqual(['server-owned']);
    });
  });

  describe('beginToggle — error path', () => {
    it('in optimistic mode, rolls values back to rollbackTo', async () => {
      h.values.set(['a', 'b']); // optimistic write already done by consumer
      const action: CngxSelectCommitAction<T[]> = () => {
        throw new Error('boom');
      };
      h.handler.beginToggle(['a', 'b'], ['a'], opt('b'), action);
      expect(h.stateLog).toEqual(['pending', 'error']);
      expect(h.errorLog.length).toBe(1);
      expect(h.values()).toEqual(['a']);
    });

    it('in pessimistic mode, leaves values untouched on error', () => {
      h.commitMode.set('pessimistic');
      h.values.set(['a']); // no optimistic write yet
      const action: CngxSelectCommitAction<T[]> = () => {
        throw new Error('boom');
      };
      h.handler.beginToggle(['a', 'b'], ['a'], opt('b'), action);
      expect(h.values()).toEqual(['a']);
    });

    it('emits "removed" announce on error', () => {
      const action: CngxSelectCommitAction<T[]> = () => {
        throw new Error('boom');
      };
      h.handler.beginToggle(['a', 'b'], ['a'], opt('b'), action);
      expect(h.coreMock.announceCalls.at(-1)).toMatchObject({
        option: null,
        action: 'removed',
        assertive: true,
      });
    });
  });

  describe('beginClear', () => {
    it('success clears values and fires onClearFinalize with previous + final arrays', () => {
      h.values.set([]); // optimistic
      const action: CngxSelectCommitAction<T[]> = (next) => next;
      h.handler.beginClear(['a', 'b'], action);
      expect(h.stateLog).toEqual(['pending', 'success']);
      expect(h.clearFinalizeLog).toEqual([[['a', 'b'], []]]);
      expect(h.values()).toEqual([]);
    });

    it('error in optimistic mode rolls back to the previous array', () => {
      h.values.set([]);
      const action: CngxSelectCommitAction<T[]> = () => {
        throw new Error('nope');
      };
      h.handler.beginClear(['a', 'b'], action);
      expect(h.values()).toEqual(['a', 'b']);
      expect(h.clearFinalizeLog).toEqual([]);
    });

    it('announces "removed" after a successful clear with the final-length count', () => {
      h.values.set([]);
      const action: CngxSelectCommitAction<T[]> = () => [];
      h.handler.beginClear(['a'], action);
      expect(h.coreMock.announceCalls.at(-1)).toMatchObject({
        option: null,
        action: 'removed',
        count: 0,
        assertive: true,
      });
    });
  });

  describe('retryLast', () => {
    it('routes to beginToggle when togglingOption is non-null', () => {
      const action: CngxSelectCommitAction<T[]> = (next) => next;
      h.commitAction.set(action);
      h.lastCommitted = ['a'];
      h.coreMock.togglingOption.set(opt('b'));
      // Simulate a prior failed begin so intendedValue is set.
      h.handler.beginToggle(['a', 'b'], ['a'], opt('b'), () => {
        throw new Error('first fail');
      });
      // Clean logs.
      h.stateLog.length = 0;
      h.toggleFinalizeLog.length = 0;

      h.handler.retryLast();

      expect(h.stateLog).toEqual(['pending', 'success']);
      expect(h.toggleFinalizeLog.length).toBe(1);
    });

    it('routes to beginClear when togglingOption is null', () => {
      const action: CngxSelectCommitAction<T[]> = (next) => next;
      h.commitAction.set(action);
      h.lastCommitted = ['a', 'b'];
      // Null togglingOption = clear semantics.
      h.coreMock.togglingOption.set(null);
      h.handler.beginClear(['a', 'b'], () => {
        throw new Error('first fail');
      });
      h.stateLog.length = 0;
      h.clearFinalizeLog.length = 0;

      h.handler.retryLast();

      expect(h.stateLog).toEqual(['pending', 'success']);
      expect(h.clearFinalizeLog.length).toBe(1);
    });

    it('is a no-op when commitAction is null', () => {
      h.handler.retryLast();
      expect(h.stateLog).toEqual([]);
    });

    it('is a no-op when no previous commit was begun', () => {
      const action: CngxSelectCommitAction<T[]> = (next) => next;
      h.commitAction.set(action);
      h.handler.retryLast();
      expect(h.stateLog).toEqual([]);
    });
  });

  describe('value-reconciliation guard', () => {
    it('does not set values when the final array has the same contents', () => {
      const initialRef = h.values();
      const action: CngxSelectCommitAction<T[]> = () => ['a']; // same contents as initial
      h.handler.beginToggle(['a'], ['a'], opt('a'), action);
      // values signal should not have been set (same-contents guard).
      expect(h.values()).toBe(initialRef);
    });

    it('uses the consumer-supplied compareWith for equality', () => {
      type Keyed = { readonly id: number; readonly name: string };
      const values = signal<Keyed[]>([{ id: 1, name: 'A' }]);
      const cw = signal<CngxSelectCompareFn<Keyed>>((a, b) => (a?.id ?? NaN) === (b?.id ?? NaN));
      const coreMock = makeCore();
      const handler = createArrayCommitHandler<Keyed>({
        values,
        compareWith: cw,
        commitMode: signal<CngxSelectCommitMode>('optimistic'),
        core: coreMock as unknown as CngxSelectCore<Keyed, Keyed[]>,
        commitAction: signal<CngxSelectCommitAction<Keyed[]> | null>(null),
        getLastCommitted: () => [],
        onToggleFinalize: () => undefined,
        onClearFinalize: () => undefined,
        onStateChange: () => undefined,
        onError: () => undefined,
      });
      const initialRef = values();
      // Server returns same id but different name (fresh object reference).
      const action: CngxSelectCommitAction<Keyed[]> = () => [
        { id: 1, name: 'refetched' },
      ];
      handler.beginToggle(
        [{ id: 1, name: 'A' }],
        [],
        { value: { id: 1, name: 'A' }, label: 'A', disabled: false },
        action,
      );
      // Reconcile uses key-equality → new reference SHOULD be accepted because
      // sameArrayContents checks structural equivalence via the compareWith;
      // values identity DOES change since finalValues is a different array ref
      // with the same key-wise contents → guard suppresses the set.
      expect(values()).toBe(initialRef);
    });
  });
});
