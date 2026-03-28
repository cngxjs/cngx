import { DestroyRef, inject } from '@angular/core';
import type { CngxAsyncState } from '@cngx/core/utils';
import { firstValueFrom, isObservable, type Observable } from 'rxjs';

import { createManualState, type ManualAsyncState } from './create-manual-state';

/**
 * Writable async state for mutations (POST/PUT/DELETE).
 *
 * Extends the read-only `CngxAsyncState` with an `execute()` method
 * that runs an async action and manages the full lifecycle.
 *
 * @category async
 */
export interface MutableAsyncState<T> extends CngxAsyncState<T> {
  /**
   * Execute an async action.
   *
   * Sets status to `pending`, then `success` or `error` on completion.
   * Supersedes any in-flight execution — the previous result is discarded
   * but the underlying network request is not aborted.
   */
  execute(fn: () => Promise<T> | Observable<T>): Promise<void>;

  /** Report progress (0–100) during execution. */
  reportProgress(value: number): void;

  /** Reset to `idle`, clear data, error, and progress. */
  reset(): void;
}

/**
 * Create a mutation async state — for explicit user-triggered actions.
 *
 * Must be called in an injection context (field initializer or constructor)
 * because it uses `inject(DestroyRef)` for cleanup.
 *
 * @usageNotes
 *
 * ```typescript
 * readonly saveResident = createAsyncState<Resident>();
 *
 * async handleSave(): Promise<void> {
 *   await this.saveResident.execute(
 *     () => this.api.save(this.form().value())
 *   );
 * }
 * ```
 *
 * @category async
 */
export function createAsyncState<T>(): MutableAsyncState<T> {
  const destroyRef = inject(DestroyRef);
  const state: ManualAsyncState<T> = createManualState<T>();

  let abortController: AbortController | undefined;

  destroyRef.onDestroy(() => {
    abortController?.abort();
    abortController = undefined;
  });

  return {
    // Delegate all read-only signals
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

    async execute(fn: () => Promise<T> | Observable<T>): Promise<void> {
      // Cancel any in-flight execution
      abortController?.abort();
      const controller = new AbortController();
      abortController = controller;

      state.set('pending');
      state.setProgress(undefined);

      try {
        const result$ = fn();
        const result = isObservable(result$) ? await firstValueFrom(result$) : await result$;

        // Check if this execution was superseded
        if (controller.signal.aborted) {
          return;
        }

        state.setSuccess(result);
      } catch (err: unknown) {
        if (controller.signal.aborted) {
          return;
        }
        state.setError(err);
      } finally {
        if (abortController === controller) {
          abortController = undefined;
        }
      }
    },

    reportProgress(value: number): void {
      state.setProgress(value);
    },

    reset(): void {
      abortController?.abort();
      abortController = undefined;
      state.reset();
    },
  };
}
