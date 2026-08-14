import { computed, type Signal } from '@angular/core';

import type { AsyncStatus, CngxAsyncState } from './async-state';
import { buildAsyncStateView } from './build-async-state-view';

/**
 * Aggregate N independent `CngxAsyncState`s into one derived `CngxAsyncState`.
 *
 * Pure, keyless, and injection-context-free - it reuses `buildAsyncStateView`
 * so every derived flag (`isLoading`, `isSettled`, `hasData`, ...) stays
 * single-source-consistent with every other producer. The result **is** a
 * `CngxAsyncState`, so it flows through `cngx-async-container`, the transition
 * bridges, and every other consumer unchanged.
 *
 * Combined `status` follows a fixed priority rule (first match wins):
 *
 * 1. any source `error` -> `error`
 * 2. else any source `loading`/`pending` -> `loading`
 * 3. else any source `refreshing` -> `refreshing`
 * 4. else all sources `success` -> `success`
 * 5. else -> `idle` (empty list, or any remaining `idle`)
 *
 * `data` is the per-source `data()` values in input order; each element is
 * `T | undefined` because a source carries no data until it reaches `success`.
 * `error` is the first error in input order (raw, for the single-error bridge
 * path). Emptiness is the aggregate rule - empty only when it has at least one
 * source and every source is itself empty - which the data shape cannot infer
 * (an N-element array is never length 0), so it is supplied explicitly.
 *
 * @category core/utils/async-state
 * @github https://github.com/cngxjs/cngx/blob/main/projects/core/utils/aggregate-async-state.ts
 * @since 0.1.0
 */
export function createAggregateAsyncState<T = unknown>(
  sources: Signal<readonly CngxAsyncState<unknown>[]>,
): CngxAsyncState<readonly (T | undefined)[]> {
  const status = computed<AsyncStatus>(() => {
    const list = sources();
    if (list.some((s) => s.status() === 'error')) {
      return 'error';
    }
    if (list.some((s) => s.status() === 'loading' || s.status() === 'pending')) {
      return 'loading';
    }
    if (list.some((s) => s.status() === 'refreshing')) {
      return 'refreshing';
    }
    if (list.length > 0 && list.every((s) => s.status() === 'success')) {
      return 'success';
    }
    return 'idle';
  });

  const data = computed<readonly (T | undefined)[]>(
    () => sources().map((s) => s.data() as T | undefined),
    { equal: (a, b) => a.length === b.length && a.every((v, i) => Object.is(v, b[i])) },
  );

  const error = computed(() => sources().find((s) => s.status() === 'error')?.error());

  const isEmpty = computed(() => {
    const list = sources();
    return list.length > 0 && list.every((s) => s.isEmpty());
  });

  const isFirstLoad = computed(() => sources().some((s) => s.isFirstLoad()));

  const lastUpdated = computed<Date | undefined>(
    () => {
      let max: Date | undefined;
      for (const s of sources()) {
        const d = s.lastUpdated();
        if (d != null && (max === undefined || d.getTime() > max.getTime())) {
          max = d;
        }
      }
      return max;
    },
    { equal: (a, b) => (a?.getTime() ?? null) === (b?.getTime() ?? null) },
  );

  return buildAsyncStateView<readonly (T | undefined)[]>({
    status,
    data,
    error,
    isEmpty,
    isFirstLoad,
    lastUpdated,
  });
}
