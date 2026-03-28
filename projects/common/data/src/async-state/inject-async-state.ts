import { DestroyRef, effect, inject, untracked } from '@angular/core';
import type { CngxAsyncState } from '@cngx/core/utils';
import { isObservable, type Observable, type Subscription } from 'rxjs';

import { createManualState, type ManualAsyncState } from './create-manual-state';

/** Configuration options for `injectAsyncState`. */
export interface InjectAsyncStateOptions {
  /**
   * Debounce time in ms for signal dependency changes.
   * Prevents request storms when multiple signals change rapidly.
   * @default 50
   */
  debounce?: number;
}

/**
 * Reactive async state returned by `injectAsyncState`.
 *
 * Extends the read-only `CngxAsyncState` with a `refresh()` method
 * to explicitly re-trigger the query.
 *
 * @category async
 */
export interface ReactiveAsyncState<T> extends CngxAsyncState<T> {
  /** Explicitly re-trigger the query. */
  refresh(): void;
}

/**
 * Create a reactive async state that auto-loads when signal dependencies change.
 *
 * Must be called in an injection context (field initializer or constructor).
 * The computation function is tracked by Angular's `effect()` — any signal
 * read inside `fn` will cause a re-load when it changes.
 *
 * @usageNotes
 *
 * ```typescript
 * readonly residents = injectAsyncState(
 *   () => this.api.getResidents(this.filter())
 * );
 * // Loads automatically when filter() changes.
 * // Caches last result during refresh (refreshing state).
 * // Deduplicates parallel requests.
 * ```
 *
 * @category async
 */
export function injectAsyncState<T>(
  fn: () => Promise<T> | Observable<T>,
  options?: InjectAsyncStateOptions,
): ReactiveAsyncState<T> {
  const destroyRef = inject(DestroyRef);
  const state: ManualAsyncState<T> = createManualState<T>();
  const debounceMs = options?.debounce ?? 50;

  let activeSubscription: Subscription | undefined;
  let abortController: AbortController | undefined;
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  function cancelInFlight(): void {
    activeSubscription?.unsubscribe();
    activeSubscription = undefined;
    abortController?.abort();
    abortController = undefined;
  }

  destroyRef.onDestroy(() => {
    cancelInFlight();
    if (debounceTimer !== undefined) {
      clearTimeout(debounceTimer);
      debounceTimer = undefined;
    }
  });

  function executeQuery(computation: () => Promise<T> | Observable<T>): void {
    cancelInFlight();

    // First load → 'loading', subsequent → 'refreshing'
    const status = untracked(state.isFirstLoad) ? 'loading' : 'refreshing';
    state.set(status);

    const result$ = computation();

    if (isObservable(result$)) {
      // Observable path — subscribe, cancel via unsubscribe
      let hasEmitted = false;
      activeSubscription = result$.subscribe({
        next: (value) => {
          hasEmitted = true;
          state.setSuccess(value);
        },
        error: (err: unknown) => state.setError(err),
        complete: () => {
          if (!hasEmitted) {
            // Observable completed without emitting — treat as empty success
            state.setSuccess(undefined as T);
          }
        },
      });
    } else {
      // Promise path — cancel via AbortController
      const controller = new AbortController();
      abortController = controller;

      result$
        .then(
          (value) => {
            if (!controller.signal.aborted) {
              state.setSuccess(value);
            }
          },
          (err: unknown) => {
            if (!controller.signal.aborted) {
              state.setError(err);
            }
          },
        )
        .finally(() => {
          if (abortController === controller) {
            abortController = undefined;
          }
        });
    }
  }

  // The effect calls fn() exactly once per cycle.
  // The result is captured and forwarded to executeQuery — no double invocation.
  effect(() => {
    // fn() reads signals → tracked by effect. The returned Promise/Observable
    // is captured here and executed after debounce.
    let result: Promise<T> | Observable<T>;
    try {
      result = fn();
    } catch (err: unknown) {
      // fn() threw synchronously (e.g. required signal not yet set).
      // Schedule error state after debounce to match async behavior.
      if (debounceTimer !== undefined) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        debounceTimer = undefined;
        state.setError(err);
      }, debounceMs);
      return;
    }

    if (debounceTimer !== undefined) {
      clearTimeout(debounceTimer);
    }

    // Capture result in closure — executeQuery receives it directly.
    const captured = result;
    debounceTimer = setTimeout(() => {
      debounceTimer = undefined;
      void executeQuery(() => captured);
    }, debounceMs);
  });

  return {
    status: state.status,
    data: state.data,
    error: state.error,
    progress: state.progress,
    isLoading: state.isLoading,
    isPending: state.isPending,
    isRefreshing: state.isRefreshing,
    isBusy: state.isBusy,
    isFirstLoad: state.isFirstLoad,
    isEmpty: state.isEmpty,
    hasData: state.hasData,
    isSettled: state.isSettled,
    lastUpdated: state.lastUpdated,

    refresh(): void {
      if (debounceTimer !== undefined) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
      }
      void executeQuery(fn);
    },
  };
}
