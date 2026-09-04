import { computed, linkedSignal, type Signal } from '@angular/core';
import type { AsyncStatus } from './async-state';

/**
 * Reactive current/previous pair for `AsyncStatus` transitions.
 *
 * Replaces the imperative `let previousStatus` pattern inside `effect()` calls
 * with a fully reactive, `linkedSignal`-based approach.
 *
 * @category core/utils/async-state
 * @since 0.1.0
 */
export interface StatusTransition {
  /** The current status value. */
  readonly current: Signal<AsyncStatus>;
  /** The status value before the most recent change. */
  readonly previous: Signal<AsyncStatus>;
}

/**
 * Options for {@link createTransitionTracker}.
 *
 * @category core/utils/async-state
 * @since 0.1.0
 */
export interface TransitionTrackerOptions {
  /**
   * Explicit initial `previous` value. Without it, `previous` seeds to the
   * source's mount value, so mounting never fabricates a transition
   * (`previous === current` until the first real change). Pass a seed to
   * deliberately treat the mount as a transition from a known state -
   * `{ seed: 'idle' }` restores the old phantom `idle -> X` edge.
   */
  readonly seed?: AsyncStatus;
}

/**
 * Creates a reactive transition tracker for an `AsyncStatus` source.
 *
 * Uses `linkedSignal` internally - when `source()` changes, `previous` holds
 * the prior value and `current` holds the new one. Both are memoized signals.
 *
 * At mount, `previous` equals the source's current value (no phantom
 * `idle -> X` transition for a source that mounts mid-flight); pass
 * `options.seed` to seed `previous` explicitly instead. The mount value is
 * captured lazily at the tracker's first read - a source change before
 * anything observes the tracker folds into the mount value instead of
 * fabricating a transition nobody watched happen.
 *
 * @param source Reactive function that reads the current `AsyncStatus`.
 * @param options Optional {@link TransitionTrackerOptions}.
 *
 * ```ts
 * const tracker = createTransitionTracker(() => this.state().status());
 *
 * effect(() => {
 *   const { current, previous } = tracker;
 *   if (current() === previous()) return; // no change - deduplicated by linkedSignal
 *   if (current() === 'success') { ... }
 * });
 * ```
 *
 * @category core/utils/async-state
 * @since 0.1.0
 */
export function createTransitionTracker(
  source: () => AsyncStatus,
  options?: TransitionTrackerOptions,
): StatusTransition {
  const state = linkedSignal<AsyncStatus, { current: AsyncStatus; previous: AsyncStatus }>({
    source,
    computation: (current, prev) => ({
      current,
      previous: prev?.value.current ?? options?.seed ?? current,
    }),
    equal: (a, b) => a.current === b.current && a.previous === b.previous,
  });

  return {
    current: computed(() => state().current),
    previous: computed(() => state().previous),
  };
}
