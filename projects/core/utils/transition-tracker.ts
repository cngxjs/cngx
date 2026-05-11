import { computed, linkedSignal, type Signal } from '@angular/core';
import type { AsyncStatus } from './async-state';

/**
 * Reactive current/previous pair for `AsyncStatus` transitions.
 *
 * Replaces the imperative `let previousStatus` pattern inside `effect()` calls
 * with a fully reactive, `linkedSignal`-based approach.
 *
 * @category async
 */
export interface StatusTransition {
  /** The current status value. */
  readonly current: Signal<AsyncStatus>;
  /** The status value before the most recent change. */
  readonly previous: Signal<AsyncStatus>;
}

/**
 * Creates a reactive transition tracker for an `AsyncStatus` source.
 *
 * Uses `linkedSignal` internally — when `source()` changes, `previous` holds
 * the prior value and `current` holds the new one. Both are memoized signals.
 *
 * @param source Reactive function that reads the current `AsyncStatus`.
 *
 * @usageNotes
 *
 * ```ts
 * const tracker = createTransitionTracker(() => this.state().status());
 *
 * effect(() => {
 *   const { current, previous } = tracker;
 *   if (current() === previous()) return; // no change — deduplicated by linkedSignal
 *   if (current() === 'success') { ... }
 * });
 * ```
 */
export function createTransitionTracker(source: () => AsyncStatus): StatusTransition {
  const state = linkedSignal<AsyncStatus, { current: AsyncStatus; previous: AsyncStatus }>({
    source,
    computation: (current, prev) => ({
      current,
      previous: prev?.value.current ?? 'idle',
    }),
    equal: (a, b) => a.current === b.current && a.previous === b.previous,
  });

  return {
    current: computed(() => state().current),
    previous: computed(() => state().previous),
  };
}
