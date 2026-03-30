import { signal } from '@angular/core';
import { of, delay, timer, switchMap, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { optimistic } from './optimistic';

describe('optimistic', () => {
  it('sets value immediately (optimistic)', () => {
    const name = signal('Alice');
    const [update] = optimistic(name, (v) => of(v).pipe(delay(100)));

    update('Bob');
    expect(name()).toBe('Bob'); // immediate, not after delay
  });

  it('applies server-confirmed value on success', async () => {
    vi.useFakeTimers();
    const name = signal('Alice');
    const [update] = optimistic(name, (v) => of(`${v}!`).pipe(delay(50)));

    update('Bob');
    expect(name()).toBe('Bob');

    await vi.advanceTimersByTimeAsync(50);
    expect(name()).toBe('Bob!'); // server confirmed with modification
    vi.useRealTimers();
  });

  it('rolls back on error', async () => {
    vi.useFakeTimers();
    const name = signal('Alice');
    // Delay the error so we can observe the optimistic value before rollback
    const [update, state] = optimistic(name, () =>
      timer(10).pipe(switchMap(() => throwError(() => new Error('fail')))),
    );

    update('Bob');
    expect(name()).toBe('Bob'); // optimistic

    await vi.advanceTimersByTimeAsync(10);
    expect(name()).toBe('Alice'); // rolled back
    expect(state.rolledBack()).toBe(true);
    expect(state.error()).toBeInstanceOf(Error);
    vi.useRealTimers();
  });

  it('clears rolledBack on next successful update', async () => {
    vi.useFakeTimers();
    const name = signal('Alice');
    let shouldFail = true;
    const [update, state] = optimistic(name, (v) =>
      shouldFail ? throwError(() => new Error('fail')) : of(v),
    );

    update('Bob');
    await vi.advanceTimersByTimeAsync(0);
    expect(state.rolledBack()).toBe(true);

    shouldFail = false;
    update('Charlie');
    expect(state.rolledBack()).toBe(false); // cleared on new attempt
    await vi.advanceTimersByTimeAsync(0);
    expect(name()).toBe('Charlie');
    vi.useRealTimers();
  });
});
