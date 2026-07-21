import { computed, type Signal } from '@angular/core';
import { buildAsyncStateView, type AsyncStatus, type CngxAsyncState } from '@cngx/core/utils';

/**
 * Minimal structural view of a TanStack Query result — the signal-bag fields
 * `fromQuery` reads.
 *
 * A `CreateQueryResult<T>` from `@tanstack/angular-query-experimental`
 * satisfies this shape (its `status` / `fetchStatus` / `data` / `error` are
 * all `Signal`s), so the adapter stays decoupled from TanStack's experimental
 * proxy typing while still accepting a real query result directly.
 *
 * @category interop/query
 */
export interface CngxQueryLike<T> {
  /** TanStack query status. */
  readonly status: Signal<'pending' | 'error' | 'success'>;
  /** TanStack fetch status — `fetching` signals an in-flight request. */
  readonly fetchStatus: Signal<'fetching' | 'paused' | 'idle'>;
  /** The most recent successful result, or `undefined`. */
  readonly data: Signal<T | undefined>;
  /** The most recent error, or `null`/`undefined`. */
  readonly error: Signal<unknown>;
}

/**
 * Bridge that projects a TanStack Query result onto `CngxAsyncState<T>`.
 *
 * Reads the query's signal-bag and maps TanStack's `status` / `fetchStatus`
 * pair onto the cngx `AsyncStatus` union, then hands the derived signals to
 * `buildAsyncStateView` — the same single-source-of-truth kernel every other
 * producer uses. No injection context is required (only `computed()`), and no
 * boolean view is re-derived here.
 *
 * Status mapping:
 * - `error` → `error`
 * - `success` + `fetching` → `refreshing` (background refetch, data visible)
 * - `success` + idle/paused → `success`
 * - `pending` + `fetching` → `loading` (first load, no data yet)
 * - `pending` + idle/paused → `idle` (disabled or paused query)
 *
 * ```typescript
 * private readonly query = injectQuery(() => ({
 *   queryKey: ['users', this.filter()],
 *   queryFn: () => fetchUsers(this.filter()),
 * }));
 *
 * readonly users = fromQuery(this.query);
 * // users.status(), users.data(), users.isFirstLoad() — all work
 * // <cngx-async-container [state]="users"> — direct binding
 * ```
 *
 * @category interop/query
 */
export function fromQuery<T>(query: CngxQueryLike<T>): CngxAsyncState<T> {
  const status = computed((): AsyncStatus => {
    const s = query.status();
    if (s === 'error') {
      return 'error';
    }
    const fetching = query.fetchStatus() === 'fetching';
    if (s === 'success') {
      // Data is already present; a concurrent fetch is a background refresh.
      return fetching ? 'refreshing' : 'success';
    }
    // s === 'pending' — no successful load has completed yet.
    return fetching ? 'loading' : 'idle';
  });

  const data = computed(() => query.data());
  const error = computed(() => query.error());
  const isFirstLoad = computed(() => query.status() === 'pending');

  return buildAsyncStateView<T>({ status, data, error, isFirstLoad });
}
