import { type OutputRef } from '@angular/core';
import { vi, type Mock } from 'vitest';

/** A typed spy wrapper around an Angular output. */
export interface OutputSpy<T> {
  /** The underlying vi.fn() mock. */
  fn: Mock<(value: T) => void>;
  /** The last emitted value, or undefined if not emitted. */
  lastValue: () => T | undefined;
  /** Number of times the output was emitted. */
  callCount: () => number;
  /** All emitted values in order. */
  values: () => T[];
  /** Unsubscribe from the output. */
  destroy: () => void;
}

/**
 * Subscribes a vitest spy to an Angular `output()` and returns a typed wrapper.
 *
 * @example
 * ```typescript
 * const spy = spyOnOutput(directive.sortChange);
 * directive.setSort('name');
 * expect(spy.callCount()).toBe(1);
 * expect(spy.lastValue()).toEqual({ active: 'name', direction: 'asc' });
 * ```
 */
export function spyOnOutput<T>(output: OutputRef<T>): OutputSpy<T> {
  const fn = vi.fn<(value: T) => void>();
  const sub = output.subscribe((value) => fn(value));

  return {
    fn,
    lastValue: () => {
      const calls = fn.mock.calls;
      return calls.length > 0 ? calls[calls.length - 1][0] : undefined;
    },
    callCount: () => fn.mock.calls.length,
    values: () => fn.mock.calls.map((c) => c[0]),
    destroy: () => sub.unsubscribe(),
  };
}
