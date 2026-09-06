import { computed, linkedSignal, type Signal } from '@angular/core';
import type { AsyncStatus } from './async-state';

/**
 * Reactive current/previous pair for arbitrary value transitions.
 *
 * Replaces the imperative `let previous` pattern inside `effect()` calls
 * with a fully reactive, `linkedSignal`-based approach.
 *
 * @category core/utils/async-state
 * @since 0.1.0
 * @relatedTo StatusTransition, createTransitionTracker
 */
export interface ValueTransition<T> {
  /** The current value. */
  readonly current: Signal<T>;
  /** The value before the most recent change. */
  readonly previous: Signal<T>;
}

/**
 * Reactive current/previous pair for `AsyncStatus` transitions - the
 * {@link ValueTransition} specialisation every async-state bridge consumes.
 *
 * @category core/utils/async-state
 * @since 0.1.0
 */
export type StatusTransition = ValueTransition<AsyncStatus>;

/**
 * Options for {@link createTransitionTracker}.
 *
 * @category core/utils/async-state
 * @since 0.1.0
 */
export interface TransitionTrackerOptions<T = AsyncStatus> {
  /**
   * Explicit initial `previous` value. Without it, `previous` seeds to the
   * source's mount value, so mounting never fabricates a transition
   * (`previous === current` until the first real change). Pass a seed to
   * deliberately treat the mount as a transition from a known state -
   * `{ seed: 'idle' }` restores the old phantom `idle -> X` edge.
   * Nullish seeds are treated as absent - a source whose values include
   * `null`/`undefined` cannot use this option.
   */
  readonly seed?: T;
  /**
   * Value equality for `T`. Defaults to `Object.is` - pass a structural
   * fn when the source produces object snapshots, per the equality rule
   * on object-valued reactives.
   */
  readonly equal?: (a: T, b: T) => boolean;
}

/**
 * Creates a reactive transition tracker for any value source. Defaults to
 * `AsyncStatus` - the original specialisation - but tracks booleans, enums,
 * or object snapshots (pass `options.equal`) just the same.
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
export function createTransitionTracker<T = AsyncStatus>(
  source: () => T,
  options?: TransitionTrackerOptions<T>,
): ValueTransition<T> {
  const eq = options?.equal ?? Object.is;
  const state = linkedSignal<T, { current: T; previous: T }>({
    source,
    computation: (current, prev) => ({
      current,
      previous: prev?.value.current ?? options?.seed ?? current,
    }),
    equal: (a, b) => eq(a.current, b.current) && eq(a.previous, b.previous),
  });

  return {
    current: computed(() => state().current),
    previous: computed(() => state().previous),
  };
}
