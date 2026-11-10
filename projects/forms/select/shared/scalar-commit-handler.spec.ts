import { signal, type WritableSignal } from '@angular/core';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  createScalarCommitHandler,
  dispatchScalarClear,
  type ScalarCommitHandler,
} from './scalar-commit-handler';
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
    onValueWrite: opts?.withValueWrite === false ? undefined : (v) => valueWriteLog.push(v),
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

  describe('beginCommit - null result', () => {
    it('treats a null server result as no result and keeps the intended value', () => {
      const action = (() => null) as unknown as CngxSelectCommitAction<T>;
      h.handler.beginCommit('a', undefined, action);
      expect(h.value()).toBe('a');
    });
  });

  describe('beginClear', () => {
    it('sends undefined, empties the value optimistically and finalizes on success', () => {
      h.value.set('a');
      h.togglingOption.set(opt('b'));
      const calls: (T | undefined)[] = [];
      const pending = new Subject<T | undefined>();
      h.handler.beginClear('a', (next) => {
        calls.push(next);
        return pending.asObservable();
      });
      expect(calls).toEqual([undefined]);
      expect(h.value()).toBeUndefined();
      expect(h.togglingOption()).toBeNull();
      pending.next(undefined);
      pending.complete();
      expect(h.stateLog).toEqual(['pending', 'success']);
      expect(h.finalizeLog).toEqual([{ option: null, finalValue: undefined, previousValue: 'a' }]);
    });

    it('rolls back on failure and retry replays the clear', () => {
      h.value.set('a');
      const calls: (T | undefined)[] = [];
      const action: CngxSelectCommitAction<T> = (next) => {
        calls.push(next);
        throw new Error('server down');
      };
      h.commitAction.set(action);
      h.handler.beginClear('a', action);
      expect(h.value()).toBe('a');
      expect(h.commitErrorLog).toHaveLength(1);

      h.handler.retryLast();

      expect(calls).toEqual([undefined, undefined]);
      expect(h.value()).toBe('a');
    });

    it('supersedes a pending select, so the late select result cannot undo the clear', () => {
      h.value.set('b');
      const first = new Subject<T | undefined>();
      h.handler.beginCommit('b', 'a', () => first.asObservable());
      h.handler.beginClear('b', () => undefined);
      first.next('b');
      first.complete();
      expect(h.value()).toBeUndefined();
    });

    it('routes an empty result to onClearFinalize when one is given', () => {
      const cleared: (T | undefined)[] = [];
      const value = signal<T | undefined>('a');
      const handler = createScalarCommitHandler<T>({
        value,
        compareWith: signal<CngxSelectCompareFn<T>>((a, b) => Object.is(a, b)),
        commitMode: signal<CngxSelectCommitMode>('optimistic'),
        core: {
          commitController: createCommitController<T>(),
          togglingOption: signal(null),
          findOption: () => null,
        } as unknown as CngxSelectCore<T, T>,
        commitAction: signal(null),
        onCommitFinalize: () => {
          throw new Error('clear must not finalize as a selection');
        },
        onClearFinalize: (previous) => cleared.push(previous),
        onCommitError: () => undefined,
        onStateChange: () => undefined,
        onError: () => undefined,
      });
      handler.beginClear('a', () => undefined);
      expect(cleared).toEqual(['a']);
    });

    it('routes a server-normalised empty scalar result to onClearFinalize', () => {
      for (const empty of [null, ''] as unknown[]) {
        const cleared: (T | undefined)[] = [];
        const value = signal<T | undefined>('a');
        const handler = createScalarCommitHandler<T>({
          value,
          compareWith: signal<CngxSelectCompareFn<T>>((a, b) => Object.is(a, b)),
          commitMode: signal<CngxSelectCommitMode>('optimistic'),
          core: {
            commitController: createCommitController<T>(),
            togglingOption: signal(null),
            findOption: () => null,
          } as unknown as CngxSelectCore<T, T>,
          commitAction: signal(null),
          onCommitFinalize: () => {
            throw new Error('an empty result must not finalize as a selection');
          },
          onClearFinalize: (previous) => cleared.push(previous),
          onCommitError: () => undefined,
          onStateChange: () => undefined,
          onError: () => undefined,
        });
        handler.beginClear('a', () => empty as T | undefined);
        expect(cleared).toEqual(['a']);
      }
    });
  });

  it('requires beginClear on a custom handler, so a clear never degrades silently', () => {
    const partial = {
      beginCommit: () => undefined,
      dispatchFromActivation: () => undefined,
      finalizeSelection: () => undefined,
      retryLast: () => undefined,
    };
    // @ts-expect-error beginClear is a required member
    const handler: ScalarCommitHandler<T> = partial;
    expect(handler).toBe(partial);
  });

  describe('dispatchScalarClear', () => {
    function coreOf(controller = createCommitController<T>()): CngxSelectCore<T, T> {
      return {
        commitController: controller,
        togglingOption: signal<CngxSelectOptionDef<T> | null>(opt('a')),
        findOption: () => null,
      } as unknown as CngxSelectCore<T, T>;
    }

    it('without an action cancels a pending commit, settles its state and clears locally', () => {
      const controller = createCommitController<T>();
      const core = coreOf(controller);
      controller.begin(() => new Subject<T>().asObservable(), 'a', undefined, {
        onSuccess: () => undefined,
        onError: () => undefined,
      });
      expect(controller.isCommitting()).toBe(true);
      let cleared = false;
      dispatchScalarClear<T>({
        core,
        handler: h.handler,
        commitAction: signal(null),
        previous: 'a',
        clearLocally: () => {
          cleared = true;
        },
      });
      expect(controller.isCommitting()).toBe(false);
      expect(controller.state.status()).toBe('idle');
      expect(core.togglingOption()).toBeNull();
      expect(cleared).toBe(true);
    });

    it('with an action routes through beginClear and never clears locally', () => {
      h.value.set('a');
      const calls: (T | undefined)[] = [];
      const action: CngxSelectCommitAction<T> = (next) => {
        calls.push(next);
        return next;
      };
      dispatchScalarClear<T>({
        core: coreOf(),
        handler: h.handler,
        commitAction: signal(action),
        previous: 'a',
        clearLocally: () => {
          throw new Error('must not clear locally');
        },
      });
      expect(calls).toEqual([undefined]);
      expect(h.value()).toBeUndefined();
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

    it('in optimistic mode keeps an external write made while the commit was pending', () => {
      h.value.set('b');
      const pending = new Subject<T>();
      h.handler.beginCommit('b', 'a', () => pending);
      h.value.set('c');
      pending.error(new Error('boom'));
      expect(h.stateLog).toEqual(['pending', 'error']);
      expect(h.value()).toBe('c');
      expect(h.valueWriteLog).not.toContain('a');
      expect(h.commitErrorLog.length).toBe(1);
    });

    it('in optimistic mode still rolls back after a pending window without external write', () => {
      h.value.set('b');
      const pending = new Subject<T>();
      h.handler.beginCommit('b', 'a', () => pending);
      pending.error(new Error('boom'));
      expect(h.value()).toBe('a');
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

  describe('beginCommit - superseded', () => {
    it('rolls a superseding commit back to the confirmed value, not the pending one', () => {
      const first = new Subject<T>();
      const second = new Subject<T>();
      h.value.set('b');
      h.handler.beginCommit('b', 'a', () => first);
      h.value.set('c');
      h.handler.beginCommit('c', 'b', () => second);
      second.error(new Error('boom'));
      expect(h.value()).toBe('a');
      expect(h.valueWriteLog.at(-1)).toBe('a');
    });

    it('reports the confirmed value as previous when the superseding commit succeeds', () => {
      const first = new Subject<T>();
      h.value.set('b');
      h.handler.beginCommit('b', 'a', () => first);
      h.value.set('c');
      h.handler.beginCommit('c', 'b', (next) => next);
      expect(h.finalizeLog.at(-1)).toMatchObject({ finalValue: 'c', previousValue: 'a' });
    });
  });

  describe('finalizeSelection', () => {
    it('writes the value and finalizes without touching the commit state machine', () => {
      h.handler.finalizeSelection('a', opt('a'), 'b');
      expect(h.value()).toBe('a');
      expect(h.valueWriteLog).toEqual(['a']);
      expect(h.finalizeLog).toEqual([{ option: opt('a'), finalValue: 'a', previousValue: 'b' }]);
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
    it('replays the last failed commit using the controller intended value', () => {
      const action: CngxSelectCommitAction<T> = (next) => next;
      h.commitAction.set(action);
      h.handler.beginCommit('a', undefined, () => {
        throw new Error('first fail');
      });
      h.stateLog.length = 0;
      h.finalizeLog.length = 0;

      h.handler.retryLast();
      expect(h.stateLog).toEqual(['pending', 'success']);
      expect(h.value()).toBe('a');
    });

    it('is a no-op once the last commit succeeded', () => {
      const action: CngxSelectCommitAction<T> = (next) => next;
      h.commitAction.set(action);
      h.handler.beginCommit('a', undefined, action);
      h.stateLog.length = 0;
      h.handler.retryLast();
      expect(h.stateLog).toEqual([]);
    });

    it('is a no-op when no commit action is bound', () => {
      h.handler.retryLast();
      expect(h.stateLog).toEqual([]);
    });

    it('re-applies the intended value while an optimistic retry is pending', () => {
      h.value.set('b');
      h.handler.beginCommit('b', 'a', () => {
        throw new Error('first fail');
      });
      expect(h.value()).toBe('a');
      const pending = new Subject<T>();
      h.commitAction.set(() => pending.asObservable());
      h.valueWriteLog.length = 0;

      h.handler.retryLast();

      expect(h.value()).toBe('b');
      expect(h.valueWriteLog).toEqual(['b']);
      pending.next('b');
      pending.complete();
      expect(h.value()).toBe('b');
    });

    it('leaves the value alone while a pessimistic retry is pending', () => {
      h.commitMode.set('pessimistic');
      h.value.set('a');
      h.handler.beginCommit('b', 'a', () => {
        throw new Error('first fail');
      });
      h.commitAction.set(() => new Subject<T>().asObservable());

      h.handler.retryLast();

      expect(h.value()).toBe('a');
    });
  });
});
