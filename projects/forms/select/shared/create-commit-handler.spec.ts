import { signal, type WritableSignal } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';

import { createCreateCommitHandler } from './create-commit-handler';
import { createCommitController } from './commit-controller.token';
import { createLocalItemsBuffer } from './local-items-buffer';
import type { CngxSelectCreateAction } from './create-action.types';
import type { CngxSelectOptionDef } from './option.model';
import type { CngxSelectCompareFn } from './internal/select-core';

type T = string;
type Prev = readonly T[];

interface CreatedCall {
  created: CngxSelectOptionDef<T>;
  previousSnapshot: Prev;
}

interface Harness {
  readonly quickCreateAction: WritableSignal<CngxSelectCreateAction<T> | null>;
  readonly closeOnSuccess: WritableSignal<boolean>;
  readonly localItemsBuffer: ReturnType<typeof createLocalItemsBuffer<T>>;
  readonly stateLog: string[];
  readonly createdLog: CreatedCall[];
  readonly announceLog: CngxSelectOptionDef<T>[];
  readonly errorLog: unknown[];
  readonly closeLog: number[];
  readonly resetDirtyLog: number[];
  readonly actionCalls: { searchTerm: string; draft: { label: string } }[];
  handler: ReturnType<typeof createCreateCommitHandler<T, Prev>>;
}

function makeHarness(): Harness {
  const quickCreateAction = signal<CngxSelectCreateAction<T> | null>(null);
  const closeOnSuccess = signal(true);
  const compareWith = signal<CngxSelectCompareFn<T>>((a, b) => Object.is(a, b));
  const localItemsBuffer = createLocalItemsBuffer<T>(compareWith);

  const stateLog: string[] = [];
  const createdLog: CreatedCall[] = [];
  const announceLog: CngxSelectOptionDef<T>[] = [];
  const errorLog: unknown[] = [];
  const closeLog: number[] = [];
  const resetDirtyLog: number[] = [];
  const actionCalls: Harness['actionCalls'] = [];

  const handler = createCreateCommitHandler<T, Prev>({
    quickCreateAction,
    commitController: createCommitController<T>(),
    localItemsBuffer,
    closeOnSuccess,
    onCreated: (created, previousSnapshot) => createdLog.push({ created, previousSnapshot }),
    onAnnounce: (option) => announceLog.push(option),
    onStateChange: (status) => stateLog.push(status),
    onError: (err) => errorLog.push(err),
    onClose: () => closeLog.push(1),
    onResetDirty: () => resetDirtyLog.push(1),
  });

  return {
    quickCreateAction,
    closeOnSuccess,
    localItemsBuffer,
    stateLog,
    createdLog,
    announceLog,
    errorLog,
    closeLog,
    resetDirtyLog,
    actionCalls,
    handler,
  };
}

describe('createCreateCommitHandler', () => {
  let h: Harness;

  beforeEach(() => {
    h = makeHarness();
  });

  describe('dispatch - success', () => {
    beforeEach(() => {
      h.quickCreateAction.set((searchTerm, draft) => {
        h.actionCalls.push({ searchTerm, draft });
        return `id:${draft.label}`;
      });
    });

    it('invokes the action with the live search term and draft', () => {
      h.handler.dispatch({ label: 'New' }, 'new', ['x']);
      expect(h.actionCalls).toEqual([{ searchTerm: 'new', draft: { label: 'New' } }]);
    });

    it('emits pending → success and patches the local-items buffer with the drafted label', () => {
      h.handler.dispatch({ label: 'New' }, 'new', ['x']);
      expect(h.stateLog).toEqual(['pending', 'success']);
      expect(h.localItemsBuffer.items()).toEqual([{ value: 'id:New', label: 'New' }]);
    });

    it('resets dirty, fires onCreated with the previous snapshot, then announces', () => {
      h.handler.dispatch({ label: 'New' }, 'new', ['a', 'b']);
      expect(h.resetDirtyLog.length).toBe(1);
      expect(h.createdLog).toEqual([
        { created: { value: 'id:New', label: 'New' }, previousSnapshot: ['a', 'b'] },
      ]);
      expect(h.announceLog).toEqual([{ value: 'id:New', label: 'New' }]);
    });

    it('closes the panel when closeOnSuccess is true', () => {
      h.handler.dispatch({ label: 'New' }, 'new', []);
      expect(h.closeLog.length).toBe(1);
    });

    it('keeps the panel open when closeOnSuccess is false', () => {
      h.closeOnSuccess.set(false);
      h.handler.dispatch({ label: 'New' }, 'new', []);
      expect(h.closeLog.length).toBe(0);
    });
  });

  it('short-circuits an undefined committed value: no patch, no onCreated', () => {
    h.quickCreateAction.set(() => undefined as unknown as T);
    h.handler.dispatch({ label: 'New' }, 'new', []);
    expect(h.stateLog).toEqual(['pending', 'success']);
    expect(h.localItemsBuffer.items()).toEqual([]);
    expect(h.createdLog).toEqual([]);
  });

  it('is a no-op when no create action is bound', () => {
    h.handler.dispatch({ label: 'New' }, 'new', []);
    expect(h.stateLog).toEqual([]);
  });

  describe('dispatch - error', () => {
    it('emits pending → error and forwards the error without creating', () => {
      const boom = new Error('boom');
      h.quickCreateAction.set(() => {
        throw boom;
      });
      h.handler.dispatch({ label: 'New' }, 'new', []);
      expect(h.stateLog).toEqual(['pending', 'error']);
      expect(h.errorLog).toEqual([boom]);
      expect(h.createdLog).toEqual([]);
    });
  });

  describe('retryLast', () => {
    it('replays the most recent dispatch with the cached draft, term and snapshot', () => {
      h.quickCreateAction.set((_term, draft) => `id:${draft.label}`);
      h.handler.dispatch({ label: 'New' }, 'new', ['seed']);
      h.stateLog.length = 0;
      h.createdLog.length = 0;
      h.localItemsBuffer.clear();

      h.handler.retryLast();
      expect(h.stateLog).toEqual(['pending', 'success']);
      expect(h.createdLog).toEqual([
        { created: { value: 'id:New', label: 'New' }, previousSnapshot: ['seed'] },
      ]);
    });

    it('is a no-op when never dispatched', () => {
      h.handler.retryLast();
      expect(h.stateLog).toEqual([]);
    });
  });
});
