import { computed, effect, type Signal, signal, untracked } from '@angular/core';

/**
 * Measured busy-envelope duration for a boolean-busy source.
 *
 * `lastDuration` is the wall-clock length of the most recently completed busy
 * window, or `undefined` before the first window closes. `isBusy` mirrors the
 * source. A consumer compares `lastDuration()` against a cutoff to pick, e.g., a
 * spinner (fast last operation) vs a skeleton (slow last operation) before the
 * next window even opens.
 *
 * @category core/utils
 */
export interface CngxLatencyProbe {
  /** Duration in ms of the last completed busy window, `undefined` until one closes. */
  readonly lastDuration: Signal<number | undefined>;
  /** `true` while the source reports busy. */
  readonly isBusy: Signal<boolean>;
}

/**
 * Measures how long the previous busy window lasted, from a boolean-busy source.
 *
 * The duration is a wall-clock sample taken at the busy edge - not derivable
 * from signals alone - so the probe writes `lastDuration` imperatively from an
 * `effect`. This is a **measurement side effect**: a distinct write-in-effect
 * pattern, not the same mechanism as `createVisibilityGate` (which defers its
 * `visible` write via `setTimeout`) nor the `CngxAsyncContainer` exception. It is
 * loop-safe by construction: the effect tracks only `busy()`, reads the clock in
 * `untracked()`, and never reads `lastDuration` back.
 *
 * Aggregate semantics: the probe measures the **busy-envelope**. On a
 * false->true edge it stamps `startedAt`; on the matching true->false edge it
 * records `lastDuration = clock() - startedAt`. Across concurrent operations
 * behind one boolean source (e.g. `CngxAsyncRegistry.isAnythingLoading`) that is
 * the whole in-flight window, not any single operation.
 *
 * Observation invariant: the clock is stamped at the busy transition at
 * **effect-flush granularity**, independent of whether or when `lastDuration` is
 * read. A busy window that opens **and** closes within a single synchronous tick,
 * before change detection flushes the effect, is not measured - real registry
 * transitions cross async boundaries (macrotasks), so the effect flushes between
 * them.
 *
 * Must be called in an injection context: the internal `effect` auto-cleans on
 * destroy, mirroring `createVisibilityGate`.
 *
 * @param busy A boolean-busy source (e.g. `state.isBusy` or
 *   `() => registry?.isAnythingLoading() ?? false`).
 * @param now Injectable clock, default `performance.now()` (monotonic; correct
 *   for durations, unaffected by wall-clock jumps). Inject a plain counter in
 *   specs for deterministic edge timestamps.
 * @returns `{ lastDuration, isBusy }`.
 *
 * @category core/utils
 * @github https://github.com/cngxjs/cngx/blob/main/projects/core/utils/latency-probe.ts
 * @since 0.1.0
 */
export function createLatencyProbe(
  busy: () => boolean,
  now?: () => number,
): CngxLatencyProbe {
  const clock = now ?? (() => performance.now());
  const lastDuration = signal<number | undefined>(undefined);

  let startedAt: number | undefined;
  let wasBusy = false;

  effect(() => {
    const b = busy();
    untracked(() => {
      if (b && !wasBusy) {
        startedAt = clock();
      } else if (!b && wasBusy && startedAt !== undefined) {
        lastDuration.set(clock() - startedAt);
        startedAt = undefined;
      }
      wasBusy = b;
    });
  });

  return {
    lastDuration: lastDuration.asReadonly(),
    isBusy: computed(() => busy()),
  };
}
