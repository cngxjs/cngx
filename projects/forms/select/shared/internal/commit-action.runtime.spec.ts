import { BehaviorSubject, config, EMPTY, finalize, NEVER, of, Subject, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runCommitAction } from './commit-action.runtime';

function flushMacrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('runCommitAction', () => {
  let unhandled: ReturnType<typeof vi.fn<(err: unknown) => void>>;
  let previousOnUnhandledError: typeof config.onUnhandledError;

  beforeEach(() => {
    unhandled = vi.fn<(err: unknown) => void>();
    previousOnUnhandledError = config.onUnhandledError;
    config.onUnhandledError = unhandled;
  });

  afterEach(() => {
    config.onUnhandledError = previousOnUnhandledError;
  });

  it('settles a synchronous of() once and raises no unhandled error', async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const teardown = vi.fn();

    runCommitAction<number>(() => of(42).pipe(finalize(teardown)), 1, { onSuccess, onError });
    await flushMacrotasks();

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith(42);
    expect(onError).not.toHaveBeenCalled();
    expect(teardown).toHaveBeenCalledTimes(1);
    expect(unhandled).not.toHaveBeenCalled();
  });

  it('takes only the replayed value of a BehaviorSubject and unsubscribes', async () => {
    const source = new BehaviorSubject(1);
    const onSuccess = vi.fn();

    runCommitAction<number>(() => source, 1, { onSuccess, onError: vi.fn() });
    source.next(2);
    await flushMacrotasks();

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith(1);
    expect(source.observed).toBe(false);
    expect(unhandled).not.toHaveBeenCalled();
  });

  it('settles an asynchronous Subject on its first emission only', () => {
    const source = new Subject<number>();
    const onSuccess = vi.fn();

    runCommitAction<number>(() => source, 1, { onSuccess, onError: vi.fn() });
    source.next(5);
    source.next(6);

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith(5);
    expect(source.observed).toBe(false);
  });

  it('ignores an emission after cancel()', () => {
    const source = new Subject<number>();
    const onSuccess = vi.fn();

    const handle = runCommitAction<number>(() => source, 1, { onSuccess, onError: vi.fn() });
    handle.cancel();
    source.next(5);

    expect(onSuccess).not.toHaveBeenCalled();
    expect(source.observed).toBe(false);
  });

  it('routes a synchronous throwError to onError once', async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const failure = new Error('rejected');

    runCommitAction<number>(() => throwError(() => failure), 1, { onSuccess, onError });
    await flushMacrotasks();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(failure);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(unhandled).not.toHaveBeenCalled();
  });

  it('settles an Observable that completes without a value as a CNGX2025 error', async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    runCommitAction<number>(() => EMPTY, 1, { onSuccess, onError });
    await flushMacrotasks();

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'CngxRuntimeError',
        code: 'CNGX2025',
        message: expect.stringMatching(/^CNGX2025: commitAction\(\) completed without emitting/),
      }),
    );
    expect(warn).not.toHaveBeenCalled();
    expect(unhandled).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('keeps an Observable that neither emits nor completes pending without a warning', async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    runCommitAction<number>(() => NEVER, 1, { onSuccess, onError });
    await flushMacrotasks();

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('settles of(undefined) as a success, not as an empty completion', async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    runCommitAction<number>(() => of(undefined), 1, { onSuccess, onError });
    await flushMacrotasks();

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith(undefined);
    expect(onError).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('does not settle twice when a Subject emits and then completes', () => {
    const source = new Subject<number>();
    const onSuccess = vi.fn();
    const onError = vi.fn();

    runCommitAction<number>(() => source, 1, { onSuccess, onError });
    source.next(5);
    source.complete();

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });
});
