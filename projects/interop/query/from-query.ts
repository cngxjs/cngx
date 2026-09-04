import { computed, type Signal } from '@angular/core';
import { buildAsyncStateView, type AsyncStatus, type CngxAsyncState } from '@cngx/core/utils';

/**
 * Minimal structural view of a TanStack Query result - the signal-bag fields
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
  /** TanStack fetch status - `fetching` signals an in-flight request. */
  readonly fetchStatus: Signal<'fetching' | 'paused' | 'idle'>;
  /** The most recent successful result, or `undefined`. */
  readonly data: Signal<T | undefined>;
  /** The most recent error, or `null`/`undefined`. */
  readonly error: Signal<unknown>;
  /**
   * Optional TanStack `dataUpdatedAt` (epoch ms; `0` = no successful load
   * yet). When bound, it feeds `lastUpdated` and makes the first-load latch
   * exact - placeholder data does not bump it, so a placeholder-backed query
   * still counts as first load.
   */
  readonly dataUpdatedAt?: Signal<number>;
}

/**
 * Bridge that projects a TanStack Query result onto `CngxAsyncState<T>`.
 *
 * Reads the query's signal-bag and maps TanStack's `status` / `fetchStatus`
 * pair onto the cngx `AsyncStatus` union, then hands the derived signals to
 * `buildAsyncStateView` - the same single-source-of-truth kernel every other
 * producer uses. No injection context is required (only `computed()`), and no
 * boolean view is re-derived here.
 *
 * Status mapping:
 * - `error` + `fetching` -> `loading` (no retained data) / `refreshing`
 *   (data retained) - a retry out of error reports busy again
 * - `error` + idle/paused -> `error`
 * - `success` + `fetching` -> `refreshing` (background refetch, data visible)
 * - `success` + idle/paused -> `success`
 * - `pending` + `fetching` -> `loading` (first load, no data yet)
 * - `pending` + idle/paused -> `idle` (disabled or paused query)
 *
 * With `placeholderData`, TanStack reports `success` + `fetching` while the
 * first real load runs - that maps to `refreshing` over the placeholder,
 * deliberately suppressing the skeleton (the intended TanStack UX).
 *
 * `isFirstLoad` is `!hadSuccess`, the kernel-recommended query semantics: a
 * failed or retrying first load stays `isFirstLoad === true` until data
 * actually arrived once. Bind `dataUpdatedAt` for the exact latch; without it
 * the bridge falls back to `status === 'success'` or retained data. Two
 * deliberate divergences from `fromResource`: a settled first-load error
 * stays first-load here (fromResource flips false on error), and the latch
 * is derived, so a query reset / key swap (`dataUpdatedAt` back to `0`)
 * returns to first-load instead of staying latched forever.
 *
 * ```typescript
 * private readonly query = injectQuery(() => ({
 *   queryKey: ['users', this.filter()],
 *   queryFn: () => fetchUsers(this.filter()),
 * }));
 *
 * readonly users = fromQuery(this.query);
 * // users.status(), users.data(), users.isFirstLoad() - all work
 * // <cngx-async-container [state]="users"> - direct binding
 * ```
 *
 * @category interop/query
 */
export function fromQuery<T>(query: CngxQueryLike<T>): CngxAsyncState<T> {
  const status = computed((): AsyncStatus => {
    const s = query.status();
    const fetching = query.fetchStatus() === 'fetching';
    if (s === 'error') {
      // A retry out of error is busy, not stuck on the stale error frame:
      // loading without retained data, refreshing over retained data.
      if (fetching) {
        return query.data() === undefined ? 'loading' : 'refreshing';
      }
      return 'error';
    }
    if (s === 'success') {
      // Data is already present; a concurrent fetch is a background refresh.
      return fetching ? 'refreshing' : 'success';
    }
    // s === 'pending' - no successful load has completed yet.
    return fetching ? 'loading' : 'idle';
  });

  // Success latch without an effect (fromQuery needs no injection context):
  // dataUpdatedAt is authoritative when bound (0 = never succeeded, and
  // placeholder data does not bump it); otherwise a success status or data
  // retained through an error round-trip proves a completed load.
  const hadSuccess = computed(() => {
    const updatedAt = query.dataUpdatedAt?.();
    if (updatedAt !== undefined) {
      return updatedAt > 0;
    }
    return query.status() === 'success' || query.data() !== undefined;
  });

  const isFirstLoad = computed(() => !hadSuccess());

  const updatedAtSource = query.dataUpdatedAt;
  const lastUpdated = updatedAtSource
    ? computed(
        () => {
          const ts = updatedAtSource();
          return ts > 0 ? new Date(ts) : undefined;
        },
        { equal: (a, b) => a?.getTime() === b?.getTime() },
      )
    : undefined;

  // data and error are already the query's own signals - pass them through
  // directly rather than re-wrapping in a needless computed.
  return buildAsyncStateView<T>({
    status,
    data: query.data,
    error: query.error,
    isFirstLoad,
    lastUpdated,
  });
}
