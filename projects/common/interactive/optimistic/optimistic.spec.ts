import { signal } from '@angular/core';
import { EMPTY, Subject, of, delay, timer, switchMap, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { createOptimistic, optimistic } from './optimistic';

describe('optimistic', () => {
  it('exports createOptimistic with the old name as a deprecated alias', () => {
    expect(optimistic).toBe(createOptimistic);
  });

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

  describe('status sequence and supersede', () => {
    it('walks idle, pending, success on a confirmed apply', () => {
      const name = signal('A');
      const confirm = new Subject<string>();
      const [update, state] = createOptimistic(name, () => confirm);
      expect(state.state.status()).toBe('idle');
      update('B');
      expect(state.state.status()).toBe('pending');
      confirm.next('B');
      expect(state.state.status()).toBe('success');
    });

    it('walks idle, pending, error on a failed apply', () => {
      const name = signal('A');
      const confirm = new Subject<string>();
      const [update, state] = createOptimistic(name, () => confirm);
      expect(state.state.status()).toBe('idle');
      update('B');
      expect(state.state.status()).toBe('pending');
      confirm.error(new Error('fail'));
      expect(state.state.status()).toBe('error');
    });

    it('a second apply unsubscribes the first action', () => {
      const name = signal('A');
      const runs: Subject<string>[] = [];
      const [update] = createOptimistic(name, () => {
        const s = new Subject<string>();
        runs.push(s);
        return s;
      });
      update('B');
      update('C');
      expect(runs[0].observed).toBe(false);
      expect(runs[1].observed).toBe(true);
    });

    it('a failure of the superseding apply rolls back to the last confirmed value', () => {
      const name = signal('A');
      const runs: Subject<string>[] = [];
      const [update, state] = createOptimistic(name, () => {
        const s = new Subject<string>();
        runs.push(s);
        return s;
      });
      update('B');
      update('C');
      runs[1].error(new Error('fail'));
      expect(name()).toBe('A');
      expect(state.rolledBack()).toBe(true);
    });

    it('two failures in a row both roll back and keep the latest error', () => {
      const name = signal('A');
      let n = 0;
      const [update, state] = createOptimistic(name, () => throwError(() => new Error(`e${++n}`)));
      update('B');
      expect(name()).toBe('A');
      update('C');
      expect(name()).toBe('A');
      expect(state.state.status()).toBe('error');
      expect((state.error() as Error).message).toBe('e2');
    });
  });

  describe('rollback target', () => {
    it('rolls back to the value the signal held before the apply, not the creation-time value', () => {
      const name = signal('A');
      const [update, state] = createOptimistic(name, () => throwError(() => new Error('fail')));
      name.set('B');
      update('C');
      expect(name()).toBe('B');
      expect(state.rolledBack()).toBe(true);
      expect(state.state.status()).toBe('error');
    });
  });

  describe('settle on empty completion and synchronous throw', () => {
    it('an action that completes empty confirms the applied value and settles success', () => {
      const name = signal('A');
      const [update, state] = createOptimistic(name, () => EMPTY);
      update('B');
      expect(state.state.status()).toBe('success');
      expect(state.state.isBusy()).toBe(false);
      expect(name()).toBe('B');
      expect(state.rolledBack()).toBe(false);
    });

    it('an action that throws synchronously rolls back, settles error and does not throw', () => {
      const name = signal('A');
      const [update, state] = createOptimistic<string>(name, () => {
        throw new Error('sync');
      });
      expect(() => update('B')).not.toThrow();
      expect(state.state.status()).toBe('error');
      expect(state.rolledBack()).toBe(true);
      expect(name()).toBe('A');
      expect((state.error() as Error).message).toBe('sync');
    });
  });
});
