import { Injector, runInInjectionContext } from '@angular/core';
import { EMPTY, Observable, of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { CNGX_ASYNC_CANCELLED } from '../async-click/async-click.directive';
import { createRetry, withRetry } from './with-retry';

describe('createRetry', () => {
  it('exports createRetry with the old name as a deprecated alias', () => {
    expect(withRetry).toBe(createRetry);
  });

  it('succeeds on first attempt without retrying', async () => {
    const action = vi.fn().mockResolvedValue('ok');
    const [retryable, state] = createRetry(action, { maxAttempts: 3 });

    await retryable();
    expect(action).toHaveBeenCalledTimes(1);
    expect(state.attempt()).toBe(1);
    expect(state.exhausted()).toBe(false);
  });

  it('retries on failure and succeeds on second attempt', async () => {
    vi.useFakeTimers();
    let calls = 0;
    const action = () => {
      calls++;
      if (calls === 1) return Promise.reject(new Error('fail'));
      return Promise.resolve();
    };

    const [retryable, state] = createRetry(action, { maxAttempts: 3, delay: 100, backoff: 'linear' });

    const promise = retryable();
    // First attempt fails, wait for delay
    await vi.advanceTimersByTimeAsync(100);
    await promise;

    expect(calls).toBe(2);
    expect(state.attempt()).toBe(2);
    expect(state.exhausted()).toBe(false);
    vi.useRealTimers();
  });

  it('throws after all attempts exhausted', async () => {
    const action = vi.fn().mockImplementation(async () => {
      throw new Error('always fails');
    });

    const [retryable, state] = createRetry(action, { maxAttempts: 2, delay: 10, backoff: 'linear' });

    await expect(retryable()).rejects.toThrow('always fails');
    expect(action).toHaveBeenCalledTimes(2);
    expect(state.exhausted()).toBe(true);
    expect(state.attempt()).toBe(2);
    expect(state.state.status()).toBe('error');
    expect(state.state.error()).toEqual(new Error('always fails'));
  });

  it('reset() clears all state', async () => {
    const action = vi.fn().mockResolvedValue('ok');
    const [retryable, state] = createRetry(action);

    await retryable();
    expect(state.attempt()).toBe(1);

    state.reset();
    expect(state.attempt()).toBe(0);
    expect(state.exhausted()).toBe(false);
    expect(state.lastError()).toBeUndefined();
  });

  it('reset() cancels an in-flight retry loop (generation bump)', async () => {
    vi.useFakeTimers();
    let calls = 0;
    const action = () => {
      calls++;
      return Promise.reject(new Error('fail ' + calls));
    };
    const [retryable, state] = createRetry(action, { maxAttempts: 3, delay: 100, backoff: 'linear' });

    const promise = (retryable() as Promise<unknown>).catch(() => undefined);
    // First attempt failed; the loop waits out the delay before attempt 2.
    expect(state.attempt()).toBe(1);
    state.reset();

    await vi.advanceTimersByTimeAsync(500);
    await promise;

    // The cancelled loop neither ran further attempts nor overwrote the
    // freshly reset state.
    expect(calls).toBe(1);
    expect(state.attempt()).toBe(0);
    expect(state.retrying()).toBe(false);
    expect(state.lastError()).toBeUndefined();
    vi.useRealTimers();
  });

  it('uses exponential backoff by default', async () => {
    vi.useFakeTimers();
    let calls = 0;
    const action = () => {
      calls++;
      if (calls < 3) return Promise.reject(new Error('fail'));
      return Promise.resolve();
    };

    const [retryable] = createRetry(action, { maxAttempts: 3, delay: 100 });

    const promise = retryable();
    // First retry: 100ms * 2^0 = 100ms
    await vi.advanceTimersByTimeAsync(100);
    // Second retry: 100ms * 2^1 = 200ms
    await vi.advanceTimersByTimeAsync(200);
    await promise;

    expect(calls).toBe(3);
    vi.useRealTimers();
  });
  it('a success after a failed attempt leaves no error behind', async () => {
    vi.useFakeTimers();
    let calls = 0;
    const [retryable, state] = createRetry(
      () => (++calls === 1 ? Promise.reject(new Error('first')) : Promise.resolve('ok')),
      { maxAttempts: 3, delay: 10, backoff: 'linear' },
    );
    const run = retryable();
    await vi.advanceTimersByTimeAsync(10);
    await run;
    expect(state.state.status()).toBe('success');
    expect(state.state.error()).toBeUndefined();
    expect(state.lastError()).toBeUndefined();
    vi.useRealTimers();
  });

  it('a new run after an exhausted one starts without an error', async () => {
    let fail = true;
    const [retryable, state] = createRetry(
      () => (fail ? Promise.reject(new Error('down')) : new Promise<void>(() => undefined)),
      { maxAttempts: 1 },
    );
    await expect(retryable()).rejects.toThrow('down');
    expect(state.lastError()).toEqual(new Error('down'));
    fail = false;
    void retryable();
    expect(state.state.status()).toBe('pending');
    expect(state.lastError()).toBeUndefined();
    expect(state.state.error()).toBeUndefined();
  });

  describe('abort signal and cancellation', () => {
    it('passes the action a run signal linked to the runner signal', async () => {
      let received: AbortSignal | undefined;
      let finish!: () => void;
      const [retryable] = createRetry((signal?: AbortSignal) => {
        received = signal;
        return new Promise<void>((resolve) => (finish = resolve));
      });
      const controller = new AbortController();
      const result = retryable(controller.signal);
      expect(received).toBeInstanceOf(AbortSignal);
      expect(received?.aborted).toBe(false);
      controller.abort();
      expect(received?.aborted).toBe(true);
      finish();
      await expect(result).resolves.toBe(CNGX_ASYNC_CANCELLED);
    });

    it('resolves CNGX_ASYNC_CANCELLED without calling the action on an aborted signal', async () => {
      const action = vi.fn().mockResolvedValue('ok');
      const [retryable, state] = createRetry(action);
      const controller = new AbortController();
      controller.abort();
      await expect(retryable(controller.signal)).resolves.toBe(CNGX_ASYNC_CANCELLED);
      expect(action).not.toHaveBeenCalled();
      expect(state.attempt()).toBe(0);
    });

    it('abort during backoff clears the timer, starts no attempt and settles idle', async () => {
      vi.useFakeTimers();
      const action = vi.fn().mockRejectedValue(new Error('fail'));
      const [retryable, state] = createRetry(action, { maxAttempts: 3, delay: 1000 });
      const controller = new AbortController();

      const result = retryable(controller.signal);
      await vi.advanceTimersByTimeAsync(0);
      expect(state.retrying()).toBe(true);
      expect(vi.getTimerCount()).toBe(1);

      controller.abort();
      expect(vi.getTimerCount()).toBe(0);
      await expect(result).resolves.toBe(CNGX_ASYNC_CANCELLED);
      await vi.advanceTimersByTimeAsync(5000);

      expect(action).toHaveBeenCalledTimes(1);
      expect(state.attempt()).toBe(0);
      expect(state.retrying()).toBe(false);
      expect(state.exhausted()).toBe(false);
      expect(state.state.status()).toBe('idle');
      expect(state.lastError()).toEqual(new Error('fail'));
    });

    it('resolves CNGX_ASYNC_CANCELLED and settles idle when the action reports cancellation', async () => {
      const action = vi.fn().mockResolvedValue(CNGX_ASYNC_CANCELLED);
      const [retryable, state] = createRetry(action);
      await expect(retryable()).resolves.toBe(CNGX_ASYNC_CANCELLED);
      expect(action).toHaveBeenCalledTimes(1);
      expect(state.state.status()).toBe('idle');
      expect(state.attempt()).toBe(0);
    });

    it('a direct call without a signal keeps its backoff timer after the host is destroyed', async () => {
      vi.useFakeTimers();
      const action = vi.fn().mockRejectedValue(new Error('fail'));
      const injector = Injector.create({ providers: [] }) as Injector & { destroy(): void };
      const [retryable] = runInInjectionContext(injector, () =>
        createRetry(action, { maxAttempts: 3, delay: 1000 }),
      );

      const result = retryable();
      void (result as Promise<unknown>).catch(() => undefined);
      await vi.advanceTimersByTimeAsync(0);
      injector.destroy();

      expect(vi.getTimerCount()).toBe(1);
      await vi.advanceTimersByTimeAsync(5000);
      expect(action).toHaveBeenCalledTimes(3);
    });

    it('abort during the in-flight attempt settles idle without waiting for it', async () => {
      const action = vi.fn(() => new Promise<void>(() => undefined));
      const [retryable, state] = createRetry(action);
      const controller = new AbortController();

      const result = retryable(controller.signal);
      controller.abort();

      await expect(result).resolves.toBe(CNGX_ASYNC_CANCELLED);
      expect(state.state.status()).toBe('idle');
      expect(state.attempt()).toBe(0);
      expect(state.retrying()).toBe(false);
    });

    it('an aborted run that a newer run superseded writes nothing', async () => {
      const finishers: (() => void)[] = [];
      const [retryable, state] = createRetry(
        () => new Promise<void>((resolve) => finishers.push(resolve)),
      );
      const controller = new AbortController();
      const first = retryable(controller.signal);
      const second = retryable();
      controller.abort();
      finishers[0]();
      await expect(first).resolves.toBe(CNGX_ASYNC_CANCELLED);
      expect(state.state.status()).toBe('pending');
      expect(state.attempt()).toBe(1);
      finishers[1]();
      await expect(second).resolves.toBeUndefined();
      expect(state.state.status()).toBe('success');
    });

    it('runs at least one attempt when maxAttempts is below 1', async () => {
      const action = vi.fn().mockRejectedValue(new Error('fail'));
      const [retryable, state] = createRetry(action, { maxAttempts: 0 });
      await expect(retryable()).rejects.toThrow('fail');
      expect(action).toHaveBeenCalledTimes(1);
      expect(state.exhausted()).toBe(true);
    });

    it('reset() mid-run resolves CNGX_ASYNC_CANCELLED', async () => {
      let finish!: () => void;
      const [retryable, state] = createRetry(
        () => new Promise<void>((resolve) => (finish = resolve)),
      );
      const result = retryable();
      state.reset();
      finish();
      await expect(result).resolves.toBe(CNGX_ASYNC_CANCELLED);
      expect(state.state.status()).toBe('idle');
    });

    it('reset() during an unresolved attempt resolves CNGX_ASYNC_CANCELLED without waiting', async () => {
      let fail!: (err: unknown) => void;
      let received: AbortSignal | undefined;
      const [retryable, state] = createRetry((signal?: AbortSignal) => {
        received = signal;
        return new Promise<void>((_, reject) => (fail = reject));
      });
      const result = retryable();
      expect(state.state.status()).toBe('pending');

      state.reset();
      expect(received?.aborted).toBe(true);
      await expect(result).resolves.toBe(CNGX_ASYNC_CANCELLED);
      expect(state.state.status()).toBe('idle');

      // The abandoned attempt rejects late: handled, and it writes nothing.
      fail(new Error('late'));
      await Promise.resolve();
      await Promise.resolve();
      expect(state.lastError()).toBeUndefined();
      expect(state.state.status()).toBe('idle');
    });

    it('reset() during the backoff resolves CNGX_ASYNC_CANCELLED without waiting', async () => {
      vi.useFakeTimers();
      const action = vi.fn().mockRejectedValue(new Error('fail'));
      const [retryable, state] = createRetry(action, { maxAttempts: 3, delay: 1000 });

      const result = retryable();
      await vi.advanceTimersByTimeAsync(0);
      expect(state.retrying()).toBe(true);
      expect(vi.getTimerCount()).toBe(1);

      state.reset();
      expect(vi.getTimerCount()).toBe(0);
      await expect(result).resolves.toBe(CNGX_ASYNC_CANCELLED);
      expect(action).toHaveBeenCalledTimes(1);
      expect(state.lastError()).toBeUndefined();
      expect(state.state.status()).toBe('idle');
    });

    it('a newer run aborts the signal of the run it supersedes', async () => {
      const signals: (AbortSignal | undefined)[] = [];
      const [retryable] = createRetry((signal?: AbortSignal) => {
        signals.push(signal);
        return new Promise<void>(() => undefined);
      });
      const first = retryable();
      void retryable();
      expect(signals[0]?.aborted).toBe(true);
      expect(signals[1]?.aborted).toBe(false);
      await expect(first).resolves.toBe(CNGX_ASYNC_CANCELLED);
    });

    it('reset() unsubscribes an unresolved Observable attempt', async () => {
      let subscribed = 0;
      let tornDown = 0;
      const [retryable, state] = createRetry(
        () =>
          new Observable<void>(() => {
            subscribed++;
            return () => tornDown++;
          }),
      );
      const result = retryable();
      expect(subscribed).toBe(1);
      expect(tornDown).toBe(0);

      state.reset();
      expect(tornDown).toBe(1);
      await expect(result).resolves.toBe(CNGX_ASYNC_CANCELLED);
    });

    it('unsubscribes an Observable attempt once it emits', async () => {
      let tornDown = 0;
      const [retryable, state] = createRetry(
        () =>
          new Observable<string>((subscriber) => {
            subscriber.next('ok');
            return () => tornDown++;
          }),
      );
      await expect(retryable()).resolves.toBeUndefined();
      expect(tornDown).toBe(1);
      expect(state.state.status()).toBe('success');
      await expect(createRetry(() => of('x'))[0]()).resolves.toBeUndefined();
      await expect(createRetry(() => EMPTY)[0]()).resolves.toBeUndefined();
    });

    it('a superseded run resolves CNGX_ASYNC_CANCELLED', async () => {
      const finishers: (() => void)[] = [];
      const [retryable] = createRetry(
        () => new Promise<void>((resolve) => finishers.push(resolve)),
      );
      const first = retryable();
      const second = retryable();
      finishers.forEach((finish) => finish());
      await expect(first).resolves.toBe(CNGX_ASYNC_CANCELLED);
      await expect(second).resolves.toBeUndefined();
    });
  });
});
