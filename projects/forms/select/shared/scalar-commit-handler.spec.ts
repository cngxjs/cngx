import { signal, type WritableSignal } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';

import { createScalarCommitHandler } from './scalar-commit-handler';
import { createCommitController } from './commit-controller.token';
import type { CngxSelectCommitAction, CngxSelectCommitMode } from './commit-action.types';
import type { CngxSelectOptionDef } from './option.model';
import type { CngxSelectCompareFn, CngxSelectCore } from './internal/select-core';

type T = string;

function opt(value: T, label = value): CngxSelectOptionDef<T> {
  return { value, label, disabled: false };
}

interface FinalizeCall {
  option: CngxSelectOptionDef<T> | null;
  finalValue: T | undefined;
  previousValue: T | undefined;
}

interface Harness {
  readonly value: WritableSignal<T | undefined>;
  readonly compareWith: WritableSignal<CngxSelectCompareFn<T>>;
  readonly commitMode: WritableSignal<CngxSelectCommitMode>;
  readonly commitAction: WritableSignal<CngxSelectCommitAction<T> | null>;
  readonly togglingOption: WritableSignal<CngxSelectOptionDef<T> | null>;
  readonly stateLog: string[];
  readonly finalizeLog: FinalizeCall[];
  readonly commitErrorLog: unknown[];
  readonly errorLog: unknown[];
  readonly valueWriteLog: (T | undefined)[];
  handler: ReturnType<typeof createScalarCommitHandler<T>>;
}

function makeHarness(opts?: {
  initial?: T | undefined;
  known?: CngxSelectOptionDef<T>[];
  withValueWrite?: boolean;
}): Harness {
  const value = signal<T | undefined>(opts?.initial);
  const compareWith = signal<CngxSelectCompareFn<T>>((a, b) => Object.is(a, b));
  const commitMode = signal<CngxSelectCommitMode>('optimistic');
  const commitAction = signal<CngxSelectCommitAction<T> | null>(null);
  const togglingOption = signal<CngxSelectOptionDef<T> | null>(null);
  const known = new Map((opts?.known ?? []).map((o) => [o.value, o]));

  const stateLog: string[] = [];
  const finalizeLog: FinalizeCall[] = [];
  const commitErrorLog: unknown[] = [];
  const errorLog: unknown[] = [];
  const valueWriteLog: (T | undefined)[] = [];

  const core = {
    commitController: createCommitController<T>(),
    togglingOption,
    findOption: (v: T): CngxSelectOptionDef<T> | null => known.get(v) ?? null,
  } as unknown as CngxSelectCore<T, T>;

  const handler = createScalarCommitHandler<T>({
    value,
    compareWith,
    commitMode,
    core,
    commitAction,
    onCommitFinalize: (option, finalValue, previousValue) =>
      finalizeLog.push({ option, finalValue, previousValue }),
    onCommitError: (err) => commitErrorLog.push(err),
    onStateChange: (s) => stateLog.push(s),
    onError: (err) => errorLog.push(err),
    onValueWrite:
      opts?.withValueWrite === false ? undefined : (v) => valueWriteLog.push(v),
  });

  return {
    value,
    compareWith,
    commitMode,
    commitAction,
    togglingOption,
    stateLog,
    finalizeLog,
    commitErrorLog,
    errorLog,
    valueWriteLog,
    handler,
  };
}

describe('createScalarCommitHandler', () => {
  let h: Harness;

  beforeEach(() => {
    h = makeHarness({ initial: undefined, known: [opt('a'), opt('b')] });
  });

  describe('beginCommit - success', () => {
    it('emits pending → success, reconciles the value and nulls togglingOption', () => {
      h.togglingOption.set(opt('b'));
      const action: CngxSelectCommitAction<T> = (next) => next;
      h.handler.beginCommit('b', undefined, action);
      expect(h.stateLog).toEqual(['pending', 'success']);
      expect(h.value()).toBe('b');
      expect(h.togglingOption()).toBeNull();
    });

    it('finalizes with the resolved option and mirrors the write', () => {
      const action: CngxSelectCommitAction<T> = (next) => next;
      h.handler.beginCommit('a', undefined, action);
      expect(h.finalizeLog).toEqual([
        { option: opt('a'), finalValue: 'a', previousValue: undefined },
      ]);
      expect(h.valueWriteLog).toEqual(['a']);
    });

    it('honors the server-returned committed value over the intended one', () => {
      const action: CngxSelectCommitAction<T> = () => 'server';
      h.handler.beginCommit('a', undefined, action);
      expect(h.value()).toBe('server');
      // 'server' is not a known option → finalize option is null.
      expect(h.finalizeLog.at(-1)).toMatchObject({ option: null, finalValue: 'server' });
    });
  });

  describe('beginCommit - error', () => {
    it('in optimistic mode rolls the value back to the previous value', () => {
      h.value.set('b'); // consumer already wrote optimistically
      const boom = new Error('boom');
      const action: CngxSelectCommitAction<T> = () => {
        throw boom;
      };
      h.handler.beginCommit('b', 'a', action);
      expect(h.stateLog).toEqual(['pending', 'error']);
      expect(h.value()).toBe('a');
      expect(h.errorLog).toEqual([boom]);
      expect(h.commitErrorLog).toEqual([boom]);
      expect(h.valueWriteLog.at(-1)).toBe('a');
    });

    it('in pessimistic mode leaves the value untouched on error', () => {
      h.commitMode.set('pessimistic');
      h.value.set('a');
      const action: CngxSelectCommitAction<T> = () => {
        throw new Error('boom');
      };
      h.handler.beginCommit('b', 'a', action);
      expect(h.value()).toBe('a');
      expect(h.commitErrorLog.length).toBe(1);
    });
  });

  describe('finalizeSelection', () => {
    it('writes the value and finalizes without touching the commit state machine', () => {
      h.handler.finalizeSelection('a', opt('a'), 'b');
      expect(h.value()).toBe('a');
      expect(h.valueWriteLog).toEqual(['a']);
      expect(h.finalizeLog).toEqual([
        { option: opt('a'), finalValue: 'a', previousValue: 'b' },
      ]);
      expect(h.stateLog).toEqual([]);
    });
  });

  describe('dispatchFromActivation', () => {
    it('with an action bound: marks togglingOption, optimistically writes, then commits', () => {
      h.commitAction.set((next) => next);
      h.handler.dispatchFromActivation('a', opt('a'));
      expect(h.stateLog).toEqual(['pending', 'success']);
      expect(h.value()).toBe('a');
      expect(h.togglingOption()).toBeNull(); // nulled on success
    });

    it('without an action bound: marks togglingOption but does not commit', () => {
      h.handler.dispatchFromActivation('a', opt('a'));
      expect(h.stateLog).toEqual([]);
      expect(h.togglingOption()).toEqual(opt('a'));
      // Optimistic pre-write happens regardless of action binding.
      expect(h.value()).toBe('a');
    });
  });

  describe('retryLast', () => {
    it('replays the last commit using the controller intended value', () => {
      const action: CngxSelectCommitAction<T> = (next) => next;
      h.commitAction.set(action);
      h.handler.beginCommit('a', undefined, action);
      h.stateLog.length = 0;
      h.finalizeLog.length = 0;

      h.handler.retryLast();
      expect(h.stateLog).toEqual(['pending', 'success']);
      expect(h.value()).toBe('a');
    });

    it('is a no-op when no commit action is bound', () => {
      h.handler.retryLast();
      expect(h.stateLog).toEqual([]);
    });
  });
});
