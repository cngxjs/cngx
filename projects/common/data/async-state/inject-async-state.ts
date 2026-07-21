import { DestroyRef, effect, inject, untracked } from '@angular/core';
import type { CngxAsyncState } from '@cngx/core/utils';
import { isObservable, type Observable, type Subscription } from 'rxjs';

import { createManualState, type ManualAsyncState } from './create-manual-state';
import { injectAsyncRegistry } from '../async-registry/provide-async-registry';

/**
 * Configuration options for `injectAsyncState`.
 *
 * @category common/data/async-state
 */
export interface InjectAsyncStateOptions {
  /**
   * Debounce time in ms for signal dependency changes.
   * Prevents request storms when multiple signals change rapidly.
   * @default 50
   */
  debounce?: number;

  /**
   * Human-readable label surfaced in `CngxAsyncRegistry.activeOperations`.
   * Display only — never the registry key. Ignored unless `register` is set.
   */
  label?: string;

  /**
   * When `true`, register this state in the ambient `CngxAsyncRegistry` (if
   * one is provided via `provideAsyncRegistry()`) for the injector's lifetime,
   * and unregister automatically on destroy. Defaults to `false` — a no-op for
   * existing callers, and a no-op when no registry is provided.
   */
  register?: boolean;
}

/**
 * Reactive async state returned by `injectAsyncState`.
 *
 * Extends the read-only `CngxAsyncState` with a `refresh()` method
 * to explicitly re-trigger the query.
 *
 * @category common/data/async-state
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
 * ```typescript
 * readonly residents = injectAsyncState(
 *   () => this.api.getResidents(this.filter())
 * );
 * // Loads automatically when filter() changes.
 * // Caches last result during refresh (refreshing state).
 * // Deduplicates parallel requests.
 * ```
 *
 * @category common/data/async-state
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

  // Opt-in observability: register with the ambient CngxAsyncRegistry (if any)
  // under a fresh per-operation uid, and unregister on destroy. No-op when the
  // caller did not opt in, or when no registry is provided.
  if (options?.register) {
    const registry = injectAsyncRegistry();
    if (registry) {
      const operationId = registry.register(state, options.label);
      destroyRef.onDestroy(() => registry.unregister(operationId));
    }
  }

  function executeQuery(computation: () => Promise<T> | Observable<T>): void {
    cancelInFlight();

    // first load -> loading, subsequent -> refreshing
    const status = untracked(state.isFirstLoad) ? 'loading' : 'refreshing';
    state.set(status);

    const result$ = computation();

    if (isObservable(result$)) {
      let hasEmitted = false;
      activeSubscription = result$.subscribe({
        next: (value) => {
          hasEmitted = true;
          state.setSuccess(value);
        },
        error: (err: unknown) => state.setError(err),
        complete: () => {
          if (!hasEmitted) {
            // completed without emitting -> empty success
            state.setSuccess(undefined as T);
          }
        },
      });
    } else {
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

  // fn() runs once per cycle; signals read inside it track via effect.
  // Result is captured and run after debounce.
  effect(() => {
    let result: Promise<T> | Observable<T>;
    try {
      result = fn();
    } catch (err: unknown) {
      // sync throw (e.g. required signal not yet set) — debounce the error
      // to match the async path
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
