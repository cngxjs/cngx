import { effect, untracked, type Injector } from '@angular/core';

/**
 * Options for {@link injectTransitionLog}.
 *
 * @category core/testing
 * @since 0.1.0
 */
export interface CngxTransitionLogOptions<T> {
  /**
   * Injector the log's effect is created in. Pass it to call
   * `injectTransitionLog` outside an injection context, like `toSignal`.
   */
  readonly injector?: Injector;
  /** Whether two consecutive values count as the same entry. Default `Object.is`. */
  readonly equal?: (a: T, b: T) => boolean;
}

/**
 * The values a signal settled on, in order. Returned by {@link injectTransitionLog}.
 *
 * @category core/testing
 * @since 0.1.0
 */
export interface CngxTransitionLog<T> {
  /**
   * The recorded values, oldest first, as a frozen snapshot. Two reads
   * without a new entry return the same array.
   */
  values(): readonly T[];
  /** Empty the log. Recording continues. */
  clear(): void;
  /** Stop recording. The log keeps what it holds. */
  stop(): void;
}

/**
 * Records the distinct values a signal settles on, for asserting the sequence
 * a component went through rather than only where it ended.
 *
 * ```ts
 * const state = createAsyncStateMock();
 * const log = TestBed.runInInjectionContext(() => injectTransitionLog(state.status));
 * TestBed.tick(); // records the starting 'idle'
 *
 * state.set({ status: 'loading' });
 * TestBed.tick();
 * state.set({ status: 'success' });
 * TestBed.tick();
 *
 * expect(log.values()).toEqual(['idle', 'loading', 'success']);
 * ```
 *
 * The same assertion reads `expect(log.values()).toEqual([...])` under Jasmine
 * and Jest; the log uses no runner API.
 *
 * Values are observed per effect flush, not per write: the starting value
 * lands on the first flush after the call, not at the call. Signals coalesce
 * synchronous changes, so `loading` then `success` set in one task without a
 * flush between them records only `success`. Flush (`TestBed.tick()`, or
 * `fixture.detectChanges()` for a component) after each step you want to see.
 * A value equal to the last entry by `equal` is not recorded again.
 *
 * The log is a plain array behind a snapshot, not a signal: it is read in an
 * assertion, not rendered, and the effect that fills it writes no signal.
 *
 * Call it in an injection context, or pass `{ injector }`. The effect lives as
 * long as that injector, or as the component when called in one; `stop()`
 * ends it earlier.
 *
 * @param source The signal (or any reactive read) to record.
 * @param options Injector and equality for consecutive values.
 *
 * @category core/testing
 * @since 0.1.0
 * @relatedTo createAsyncStateMock, createTransitionTracker
 */
export function injectTransitionLog<T>(
  source: () => T,
  options: CngxTransitionLogOptions<T> = {},
): CngxTransitionLog<T> {
  const equal = options.equal ?? Object.is;
  const entries: T[] = [];
  let snapshot: readonly T[] | undefined;

  const ref = effect(
    () => {
      const value = source();
      untracked(() => {
        const last = entries.length - 1;
        if (last >= 0 && equal(entries[last], value)) {
          return;
        }
        entries.push(value);
        snapshot = undefined;
      });
    },
    { injector: options.injector },
  );

  return {
    values: () => (snapshot ??= Object.freeze([...entries])),
    clear: () => {
      entries.length = 0;
      snapshot = undefined;
    },
    stop: () => ref.destroy(),
  };
}
