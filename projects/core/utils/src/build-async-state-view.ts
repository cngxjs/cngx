import { computed, type Signal } from '@angular/core';
import type { AsyncStatus, CngxAsyncState } from './async-state';

/** Source signals for building a read-only async state view. */
export interface AsyncStateViewSources<T> {
  /** Single source of truth — the current status. */
  readonly status: Signal<AsyncStatus>;
  /** The most recent successful result. */
  readonly data: Signal<T | undefined>;
  /** The most recent error. */
  readonly error: Signal<unknown>;
  /** Progress 0–100, or `undefined` for indeterminate. */
  readonly progress?: Signal<number | undefined>;
  /**
   * Whether the first successful load has not yet completed.
   * Defaults to `computed(() => false)` when omitted — appropriate for
   * mutation producers that never show a skeleton.
   * Query producers should pass `computed(() => !hadSuccess())`.
   */
  readonly isFirstLoad?: Signal<boolean>;
  /** Timestamp of the last successful load. */
  readonly lastUpdated?: Signal<Date | undefined>;
}

const ALWAYS_FALSE: Signal<boolean> = computed(() => false);
const ALWAYS_UNDEFINED_NUMBER: Signal<number | undefined> = computed(() => undefined);
const ALWAYS_UNDEFINED_DATE: Signal<Date | undefined> = computed(() => undefined);

/**
 * Build a read-only `CngxAsyncState<T>` view from source signals.
 *
 * All derived fields (`isLoading`, `isPending`, `isEmpty`, etc.) are `computed()`
 * from the provided sources — the result is a consistent, single-source-of-truth
 * state object that cannot become inconsistent.
 *
 * This is the shared kernel used by all async state factories and state producers.
 * No injection context required — uses only `computed()`.
 *
 * @category async
 */
export function buildAsyncStateView<T>(sources: AsyncStateViewSources<T>): CngxAsyncState<T> {
  const { status, data, error } = sources;
  const progress = sources.progress ?? ALWAYS_UNDEFINED_NUMBER;
  const isFirstLoad = sources.isFirstLoad ?? ALWAYS_FALSE;
  const lastUpdated = sources.lastUpdated ?? ALWAYS_UNDEFINED_DATE;

  const isLoading = computed(() => {
    const s = status();
    return s === 'loading' || s === 'pending' || s === 'refreshing';
  });

  const isPending = computed(() => status() === 'pending');
  const isRefreshing = computed(() => status() === 'refreshing');

  const isEmpty = computed(() => {
    const d = data();
    if (d == null) {
      return true;
    }
    if (Array.isArray(d)) {
      return d.length === 0;
    }
    return false;
  });

  const hasData = computed(() => !isEmpty());

  const isSettled = computed(() => {
    const s = status();
    return s === 'success' || s === 'error';
  });

  return {
    status,
    data,
    error,
    progress,
    isLoading,
    isPending,
    isRefreshing,
    isBusy: isLoading,
    isFirstLoad,
    isEmpty,
    hasData,
    isSettled,
    lastUpdated,
  };
}
