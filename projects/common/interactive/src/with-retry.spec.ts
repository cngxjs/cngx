import { describe, expect, it, vi } from 'vitest';
import { withRetry } from './with-retry';

describe('withRetry', () => {
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
    const action = vi.fn().mockImplementation(async () => { throw new Error('always fails'); });

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
    expect(state.lastError()).toBeNull();
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
});
