import { describe, expect, it, vi } from 'vitest';
import { CNGX_ASYNC_CANCELLED } from '../async-click/async-click.directive';
import { createRetry, withRetry } from './with-retry';

describe('withRetry', () => {
  it('exports createRetry with the old name as a deprecated alias', () => {
    expect(withRetry).toBe(createRetry);
  });

  it('succeeds on first attempt without retrying', async () => {
    const action = vi.fn().mockResolvedValue('ok');
    const [retryable, state] = withRetry(action, { maxAttempts: 3 });

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

    const [retryable, state] = withRetry(action, { maxAttempts: 3, delay: 100, backoff: 'linear' });

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

    const [retryable, state] = withRetry(action, { maxAttempts: 2, delay: 10, backoff: 'linear' });

    await expect(retryable()).rejects.toThrow('always fails');
    expect(action).toHaveBeenCalledTimes(2);
    expect(state.exhausted()).toBe(true);
    expect(state.attempt()).toBe(2);
  });

  it('reset() clears all state', async () => {
    const action = vi.fn().mockResolvedValue('ok');
    const [retryable, state] = withRetry(action);

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
    const [retryable, state] = withRetry(action, { maxAttempts: 3, delay: 100, backoff: 'linear' });

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

    const [retryable] = withRetry(action, { maxAttempts: 3, delay: 100 });

    const promise = retryable();
    // First retry: 100ms * 2^0 = 100ms
    await vi.advanceTimersByTimeAsync(100);
    // Second retry: 100ms * 2^1 = 200ms
    await vi.advanceTimersByTimeAsync(200);
    await promise;

    expect(calls).toBe(3);
    vi.useRealTimers();
  });
  describe('abort signal and cancellation', () => {
    it('forwards the signal to the wrapped action', async () => {
      const action = vi.fn().mockResolvedValue('ok');
      const [retryable] = createRetry(action);
      const controller = new AbortController();
      await retryable(controller.signal);
      expect(action).toHaveBeenCalledWith(controller.signal);
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

    it('abort during backoff clears the timer, starts no attempt and writes no state', async () => {
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
      expect(state.attempt()).toBe(1);
      expect(state.retrying()).toBe(true);
      expect(state.exhausted()).toBe(false);
    });

    it('abort during the in-flight attempt lets it finish but writes nothing', async () => {
      let finish!: () => void;
      const action = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
      const [retryable, state] = createRetry(action);
      const controller = new AbortController();

      const result = retryable(controller.signal);
      controller.abort();
      finish();

      await expect(result).resolves.toBe(CNGX_ASYNC_CANCELLED);
      expect(state.state.status()).toBe('pending');
      expect(state.attempt()).toBe(1);
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
