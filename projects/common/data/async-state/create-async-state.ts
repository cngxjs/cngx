import { DestroyRef, inject } from '@angular/core';
import { CNGX_DEV_DESCRIPTORS, type CngxAsyncState } from '@cngx/core/utils';
import type { Observable } from 'rxjs';
import { settleAction, type SettleActionHandle } from '@cngx/utils/rxjs-interop';

import { createManualState, type ManualAsyncState } from './create-manual-state';
import { injectAsyncRegistry } from '../async-registry/provide-async-registry';

/**
 * Configuration options for `createAsyncState`.
 */
export interface CreateAsyncStateOptions {
  /**
   * Human-readable label surfaced in `CngxAsyncRegistry.activeOperations`.
   * Display only - never the registry key. Ignored unless `register` is set.
   */
  label?: string;

  /**
   * When `true`, register this state in the ambient `CngxAsyncRegistry` (if
   * one is provided via `provideAsyncRegistry()`) for the injector's lifetime,
   * and unregister automatically on destroy. Defaults to `false` - a no-op for
   * existing callers, and a no-op when no registry is provided.
   */
  register?: boolean;
}

/**
 * Writable async state for mutations (POST/PUT/DELETE).
 *
 * Extends the read-only `CngxAsyncState` with an `execute()` method
 * that runs an async action and manages the full lifecycle.
 */
export interface MutableAsyncState<T> extends CngxAsyncState<T> {
  /**
   * Execute an async action.
   *
   * Sets status to `pending`, then `success` or `error` on completion. An
   * Observable that completes without a value settles `success` with
   * `undefined` data. Supersedes any in-flight execution. An Observable action is unsubscribed
   * on supersede, `reset()` and destroy, so an `HttpClient` request is
   * cancelled; a Promise action keeps running and its result is dropped. The
   * returned promise resolves when the run settles or is cancelled.
   */
  execute(fn: () => Promise<T> | Observable<T>): Promise<void>;

  /** Report progress (0–100) during execution. */
  reportProgress(value: number): void;

  /** Reset to `idle`, clear data, error, and progress. */
  reset(): void;
}

/** The in-flight run of `execute()`: its settle handle and the resolver of its promise. */
interface ActiveRun {
  handle?: SettleActionHandle;
  readonly finish: () => void;
}

/**
 * Create a mutation async state - for explicit user-triggered actions.
 *
 * Must be called in an injection context (field initializer or constructor)
 * because it uses `inject(DestroyRef)` for cleanup.
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
 */
export function createAsyncState<T>(options?: CreateAsyncStateOptions): MutableAsyncState<T> {
  const destroyRef = inject(DestroyRef);
  const state: ManualAsyncState<T> = createManualState<T>();

  let active: ActiveRun | undefined;

  const cancelActive = (): void => {
    const run = active;
    active = undefined;
    run?.handle?.cancel();
    run?.finish();
  };

  destroyRef.onDestroy(cancelActive);

  // Same opt-in observability injectAsyncState offers: without it, mutations
  // built here are invisible to CngxAsyncRegistry.isAnythingLoading.
  if (options?.register) {
    const registry = injectAsyncRegistry();
    if (registry) {
      const operationId = registry.register(state, options.label);
      destroyRef.onDestroy(() => registry.unregister(operationId));
    }
  }

  const mutation: MutableAsyncState<T> = {
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

    execute(fn: () => Promise<T> | Observable<T>): Promise<void> {
      cancelActive();

      state.set('pending');
      state.setProgress(undefined);

      return new Promise<void>((resolve) => {
        const run: ActiveRun = { finish: resolve };
        active = run;
        // A superseded, reset or destroyed run is no longer `active`; its
        // handle is cancelled, so these writes only reach the current run.
        const settle = (write: () => void): void => {
          if (active !== run) {
            return;
          }
          active = undefined;
          write();
          resolve();
        };
        run.handle = settleAction(fn, {
          onValue: (value) => settle(() => state.setSuccess(value)),
          onEmpty: () => settle(() => state.setSuccess(undefined as T)),
          onError: (err) => settle(() => state.setError(err)),
        });
      });
    },

    reportProgress(value: number): void {
      state.setProgress(value);
    },

    reset(): void {
      cancelActive();
      state.reset();
    },
  };
  if (typeof ngDevMode !== 'undefined' && ngDevMode) {
    CNGX_DEV_DESCRIPTORS.tag(mutation, {
      kind: 'cngx-dev:factory',
      factory: 'createAsyncState',
      // The inner manual state carries its own tag; listing it here is the
      // only way an inspector reaches it, since the mutation exposes its
      // signals, not the state object.
      inputs: { options, state },
    });
  }
  return mutation;
}
