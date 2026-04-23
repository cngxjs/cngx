import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createManualState } from '@cngx/common/data';

import { createReorderCommitHandler } from './reorder-commit-handler';
import type { CngxCommitController } from './commit-controller';
import type {
  CngxSelectCommitAction,
  CngxSelectCommitMode,
} from './commit-action.types';
import type { CngxSelectOptionDef } from './option.model';

function makeController<T>(): {
  readonly controller: CngxCommitController<T>;
  resolve(value?: T): void;
  reject(err: unknown): void;
} {
  let res: ((v?: T) => void) | null = null;
  let rej: ((err: unknown) => void) | null = null;
  const state = createManualState<T | undefined>();
  const intended = signal<T | undefined>(undefined);
  const isCommittingState = signal(false);
  const controller: CngxCommitController<T> = {
    state,
    isCommitting: isCommittingState.asReadonly(),
    intendedValue: intended.asReadonly(),
    begin(action, intendedValue, _previous, handlers) {
      intended.set(intendedValue);
      isCommittingState.set(true);
      res = (value?: T) => {
        isCommittingState.set(false);
        handlers.onSuccess(value);
      };
      rej = (err: unknown) => {
        isCommittingState.set(false);
        handlers.onError(err, _previous);
      };
      // Call action for side-effect parity with the real controller;
      // actual subscription lifecycle is faked via res/rej above.
      void action(intendedValue);
    },
    cancel() {
      isCommittingState.set(false);
    },
  };
  return {
    controller,
    resolve: (value?: T) => res?.(value),
    reject: (err: unknown) => rej?.(err),
  };
}

const option = (value: string): CngxSelectOptionDef<string> => ({
  value,
  label: value.toUpperCase(),
});

describe('createReorderCommitHandler', () => {
  let values: ReturnType<typeof signal<string[]>>;
  let commitMode: ReturnType<typeof signal<CngxSelectCommitMode>>;
  let commitAction: ReturnType<typeof signal<CngxSelectCommitAction<string[]> | null>>;
  let onReorder: ReturnType<typeof vi.fn> & ((...args: unknown[]) => void);
  let onAnnounce: ReturnType<typeof vi.fn> & ((...args: unknown[]) => void);
  let onStateChange: ReturnType<typeof vi.fn> & ((status: string) => void);
  let onError: ReturnType<typeof vi.fn> & ((err: unknown) => void);
  let lastCommitted: string[];

  beforeEach(() => {
    values = signal<string[]>(['a', 'b', 'c', 'd']);
    commitMode = signal<CngxSelectCommitMode>('optimistic');
    commitAction = signal<CngxSelectCommitAction<string[]> | null>(null);
    onReorder = vi.fn() as never;
    onAnnounce = vi.fn() as never;
    onStateChange = vi.fn() as never;
    onError = vi.fn() as never;
    lastCommitted = [];
  });

  function make() {
    const { controller, resolve, reject } = makeController<string[]>();
    const handler = createReorderCommitHandler<string>({
      values,
      commitMode,
      commitAction,
      commitController: controller,
      getLastCommitted: () => lastCommitted,
      setLastCommitted: (v) => {
        lastCommitted = [...v];
      },
      onReorder,
      onAnnounce,
      onStateChange,
      onError,
    });
    return { handler, resolve, reject };
  }

  it('no commit action → writes values immediately, fires reorder + announce', () => {
    const { handler } = make();
    handler.dispatch(['b', 'c', 'a', 'd'], ['a', 'b', 'c', 'd'], 0, 2, option('a'));
    expect(values()).toEqual(['b', 'c', 'a', 'd']);
    expect(onReorder).toHaveBeenCalledExactlyOnceWith(
      ['b', 'c', 'a', 'd'],
      ['a', 'b', 'c', 'd'],
      option('a'),
      0,
      2,
    );
    expect(onAnnounce).toHaveBeenCalledExactlyOnceWith(option('a'), 0, 2, 4);
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it('optimistic: writes + emits immediately, rolls back on error', () => {
    commitMode.set('optimistic');
    const act: CngxSelectCommitAction<string[]> = () =>
      Promise.resolve<string[] | undefined>(undefined);
    commitAction.set(act);
    const { handler, reject } = make();
    handler.dispatch(['b', 'c', 'a', 'd'], ['a', 'b', 'c', 'd'], 0, 2, option('a'));
    expect(values()).toEqual(['b', 'c', 'a', 'd']);
    expect(onReorder).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenCalledWith('pending');

    reject(new Error('boom'));
    expect(values()).toEqual(['a', 'b', 'c', 'd']);
    expect(onStateChange).toHaveBeenCalledWith('error');
    expect(onError).toHaveBeenCalledExactlyOnceWith(expect.any(Error));
  });

  it('pessimistic: holds values, writes + emits on success only', () => {
    commitMode.set('pessimistic');
    const act: CngxSelectCommitAction<string[]> = () =>
      Promise.resolve<string[] | undefined>(undefined);
    commitAction.set(act);
    const { handler, resolve } = make();
    handler.dispatch(['b', 'c', 'a', 'd'], ['a', 'b', 'c', 'd'], 0, 2, option('a'));
    // Pessimistic: no optimistic write.
    expect(values()).toEqual(['a', 'b', 'c', 'd']);
    expect(onReorder).not.toHaveBeenCalled();
    expect(onStateChange).toHaveBeenCalledWith('pending');

    resolve();
    expect(values()).toEqual(['b', 'c', 'a', 'd']);
    expect(onReorder).toHaveBeenCalledTimes(1);
    expect(onStateChange).toHaveBeenCalledWith('success');
  });

  it('commit success with server-canonicalized final value overrides optimistic next', () => {
    commitMode.set('optimistic');
    const act: CngxSelectCommitAction<string[]> = () =>
      Promise.resolve<string[] | undefined>(undefined);
    commitAction.set(act);
    const { handler, resolve } = make();
    handler.dispatch(['b', 'c', 'a', 'd'], ['a', 'b', 'c', 'd'], 0, 2, option('a'));
    // Server returns a differently-ordered canonical array.
    resolve(['a', 'b', 'd', 'c']);
    expect(values()).toEqual(['a', 'b', 'd', 'c']);
    expect(lastCommitted).toEqual(['a', 'b', 'd', 'c']);
  });
});
