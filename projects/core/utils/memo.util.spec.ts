import { describe, it, expect, vi } from 'vitest';
import { memoize } from './memo.util';

describe('memoize', () => {
  it('runs the wrapped fn once per distinct key', () => {
    const compute = vi.fn((key: string) => key.toUpperCase());
    const memoized = memoize(compute);

    memoized('a');
    memoized('a');
    memoized('b');

    expect(compute).toHaveBeenCalledTimes(2);
  });

  it('returns the cached value on a repeat call', () => {
    let calls = 0;
    const memoized = memoize((key: number) => ({ key, calls: ++calls }));

    const first = memoized(1);
    const second = memoized(1);

    expect(second).toBe(first);
    expect(second.calls).toBe(1);
  });

  it('gives each memoize() its own cache', () => {
    const computeA = vi.fn((key: string) => `a:${key}`);
    const computeB = vi.fn((key: string) => `b:${key}`);
    const memoA = memoize(computeA);
    const memoB = memoize(computeB);

    memoA('x');
    memoB('x');

    expect(computeA).toHaveBeenCalledTimes(1);
    expect(computeB).toHaveBeenCalledTimes(1);
    expect(memoA('x')).toBe('a:x');
    expect(memoB('x')).toBe('b:x');
  });

  it('evicts the oldest entry when cacheLimit is reached', () => {
    let calls = 0;
    const fn = memoize(
      (key: string) => {
        calls++;
        return key.toUpperCase();
      },
      { cacheLimit: 2 },
    );

    expect(fn('a')).toBe('A');
    expect(fn('b')).toBe('B');
    expect(calls).toBe(2);

    fn('a');
    expect(calls).toBe(2);

    // Third distinct key evicts 'a' (oldest inserted, FIFO).
    expect(fn('c')).toBe('C');
    expect(calls).toBe(3);

    expect(fn('a')).toBe('A');
    expect(calls).toBe(4);

    // 'c' survived the re-insert of 'a' (which evicted 'b').
    fn('c');
    expect(calls).toBe(4);
  });
});
