import type { Signal } from '@angular/core';

/** Discriminated status of an async operation lifecycle. */
export type AsyncStatus = 'idle' | 'loading' | 'pending' | 'refreshing' | 'success' | 'error';

/**
 * Typed state machine interface for any asynchronous operation.
 *
 * Every derived value is a `computed()` from a single source (`status`).
 * The system cannot become inconsistent.
 *
 * All UI feedback components accept `CngxAsyncState<unknown>` as input —
 * typed on the interface, not on a concrete implementation.
 *
 * Three factories create instances:
 * - `injectAsyncState()` — reactive query (auto-loads when signals change)
 * - `createAsyncState()` — manual mutation (explicit `execute()`)
 * - `createManualState()` — fully manual (no HTTP)
 *
 * @category async
 */
export interface CngxAsyncState<T> {
  /** Current status of the async operation. Single source of truth. */
  readonly status: Signal<AsyncStatus>;

  /** The most recent successful result, or `undefined`. */
  readonly data: Signal<T | undefined>;

  /** The most recent error, or `undefined`. */
  readonly error: Signal<unknown>;

  /** Progress 0–100, or `undefined` for indeterminate. */
  readonly progress: Signal<number | undefined>;

  /** `true` when any operation is running (`loading`, `pending`, or `refreshing`). */
  readonly isLoading: Signal<boolean>;

  /** `true` only when a mutation is running (`pending`). */
  readonly isPending: Signal<boolean>;

  /** `true` only when refreshing (re-query with stale data visible). */
  readonly isRefreshing: Signal<boolean>;

  /**
   * ARIA-oriented alias for `isLoading`.
   * Maps directly to `aria-busy` — always `true` when any operation runs.
   */
  readonly isBusy: Signal<boolean>;

  /** `true` if no successful load has completed yet. */
  readonly isFirstLoad: Signal<boolean>;

  /** `true` if `data` is an empty array, `null`, or `undefined`. */
  readonly isEmpty: Signal<boolean>;

  /** `true` if `data` is present and not empty. */
  readonly hasData: Signal<boolean>;

  /** `true` when the operation has settled (`success` or `error`). */
  readonly isSettled: Signal<boolean>;

  /** Timestamp of the last successful load, or `undefined`. */
  readonly lastUpdated: Signal<Date | undefined>;
}
