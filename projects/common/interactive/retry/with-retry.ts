import { computed, signal, type Signal } from '@angular/core';
import { buildAsyncStateView, type AsyncStatus, type CngxAsyncState } from '@cngx/core/utils';
import { firstValueFrom, isObservable } from 'rxjs';

import { CNGX_ASYNC_CANCELLED, type AsyncAction } from '../async-click/async-click.directive';

/**
 * Configuration for `createRetry()`.
 */
export interface RetryConfig {
  /** Maximum number of attempts (including the first); values below 1 count as 1. Default: `3`. */
  maxAttempts?: number;
  /** Base delay in ms between retries. Default: `1000`. */
  delay?: number;
  /** Backoff strategy. `'exponential'` doubles the delay each attempt. Default: `'exponential'`. */
  backoff?: 'linear' | 'exponential';
}

/**
 * State exposed by the retryable action - read-only signals for UI feedback.
 */
export interface RetryState {
  /** Current attempt number (1-based). `0` before first invocation. */
  readonly attempt: Signal<number>;
  /** Total attempts allowed. */
  readonly maxAttempts: Signal<number>;
  /** Whether a retry is currently pending (waiting for delay). */
  readonly retrying: Signal<boolean>;
  /** Whether all attempts have been exhausted. */
  readonly exhausted: Signal<boolean>;
  /** The last error from a failed attempt. */
  readonly lastError: Signal<unknown>;
  /**
   * Full `CngxAsyncState` view of the retry lifecycle.
   *
   * Bind to any `[state]` consumer to connect the feedback system.
   * `retrying` (delay between retries) maps to `'pending'` - the feedback
   * system sees "still working" during retry delays.
   */
  readonly state: CngxAsyncState<unknown>;
  /** Manually reset - clears exhausted state, resets attempt counter. */
  reset(): void;
}

/**
 * Wraps an `AsyncAction` with automatic retry logic.
 *
 * Returns a tuple: `[action, retryState]` where `action` is a new `AsyncAction`
 * that retries on failure, and `retryState` exposes attempt/retry signals and
 * a `state: CngxAsyncState` for feedback system integration.
 *
 * Composes naturally with `CngxAsyncClick` and `CngxActionButton`:
 *
 * ```typescript
 * const [saveWithRetry, retryState] = createRetry(
 *   () => this.http.post('/api/save', data),
 *   { maxAttempts: 3, delay: 1000, backoff: 'exponential' }
 * );
 *
 * // Use with CngxAsyncClick + toast
 * <button [cngxAsyncClick]="saveWithRetry">Save</button>
 * <ng-container [cngxToastOn]="retryState.state"
 *   toastSuccess="Saved" toastError="All retries failed" />
 * ```
 *
 * The returned action takes the optional `AbortSignal` that
 * `cngxAsyncClick` passes (it aborts when the runner is destroyed) and
 * forwards it to every attempt. On abort the backoff timer is cleared, no
 * further attempt starts and an aborted run settles the retry state idle
 * (`attempt` 0, `retrying` false, `lastError` kept), unless a newer run
 * already owns the state; the in-flight attempt is not aborted by the
 * library, an action that passes the signal to `fetch` / `HttpClient` opts
 * in to that. A run that ends without an outcome
 * (superseded by a new call, `reset()`, or aborted) resolves
 * `CNGX_ASYNC_CANCELLED` instead of `undefined`. A direct call without a
 * signal (`saveWithRetry()`) has no destroy binding: it runs to its end.
 *
 * A pure factory that needs no injection context. The lifetime comes from
 * the signal of the runner that owns the run.
 */
export function createRetry(action: AsyncAction, config?: RetryConfig): [AsyncAction, RetryState] {
  // At least one attempt: the loop below ends only through a return or a throw.
  const maxAttempts = Math.max(1, config?.maxAttempts ?? 3);
  const baseDelay = config?.delay ?? 1000;
  const backoff = config?.backoff ?? 'exponential';

  const attemptState = signal(0);
  const retryingState = signal(false);
  const exhaustedState = signal(false);
  const succeededState = signal(false);
  const lastErrorState = signal<unknown>(undefined);

  const statusComputed = computed<AsyncStatus>(() => {
    if (attemptState() === 0) {
      return 'idle';
    }
    if (exhaustedState()) {
      return 'error';
    }
    if (succeededState()) {
      return 'success';
    }
    return 'pending';
  });

  const asyncState = buildAsyncStateView<unknown>({
    status: statusComputed,
    data: computed(() => undefined),
    error: lastErrorState.asReadonly(),
  });

  // Generation counter cancels any in-flight retry loop on re-invocation
  // (and on reset - a stale loop must not overwrite freshly reset state).
  let generation = 0;

  const retryState: RetryState = {
    attempt: attemptState.asReadonly(),
    maxAttempts: computed(() => maxAttempts),
    retrying: retryingState.asReadonly(),
    exhausted: exhaustedState.asReadonly(),
    lastError: lastErrorState.asReadonly(),
    state: asyncState,
    reset() {
      generation++;
      attemptState.set(0);
      retryingState.set(false);
      exhaustedState.set(false);
      succeededState.set(false);
      lastErrorState.set(undefined);
    },
  };

  const retryableAction: AsyncAction = async (abort?: AbortSignal): Promise<unknown> => {
    if (abort?.aborted) {
      return CNGX_ASYNC_CANCELLED;
    }
    const thisGeneration = ++generation;
    const cancelled = (): boolean => generation !== thisGeneration || abort?.aborted === true;
    // A superseded run leaves the state to the newer run (or to reset()); an
    // aborted run that still owns it settles idle, so no pending view outlives
    // the runner.
    const cancel = (): typeof CNGX_ASYNC_CANCELLED => {
      if (generation === thisGeneration) {
        attemptState.set(0);
        retryingState.set(false);
        exhaustedState.set(false);
        succeededState.set(false);
      }
      return CNGX_ASYNC_CANCELLED;
    };
    attemptState.set(0);
    retryingState.set(false);
    exhaustedState.set(false);
    succeededState.set(false);

    for (let attempt = 1; ; attempt++) {
      if (cancelled()) {
        return cancel();
      }
      attemptState.set(attempt);

      try {
        const result$ = action(abort);
        if (isObservable(result$)) {
          await firstValueFrom(result$, { defaultValue: undefined });
        } else {
          await result$;
        }
        if (cancelled()) {
          return cancel();
        }
        retryingState.set(false);
        succeededState.set(true);
        return undefined;
      } catch (err: unknown) {
        if (cancelled()) {
          return cancel();
        }
        lastErrorState.set(err);

        if (attempt >= maxAttempts) {
          exhaustedState.set(true);
          retryingState.set(false);
          throw err;
        }

        retryingState.set(true);
        const delayMs =
          backoff === 'exponential' ? baseDelay * Math.pow(2, attempt - 1) : baseDelay * attempt;
        await backoffDelay(delayMs, abort);
        if (cancelled()) {
          return cancel();
        }
        retryingState.set(false);
      }
    }
  };

  return [retryableAction, retryState];
}

/** Resolves after `ms`, or at once (timer cleared) when `abort` fires. */
function backoffDelay(ms: number, abort?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve) => {
    if (abort?.aborted) {
      resolve();
      return;
    }
    const done = (): void => {
      clearTimeout(timer);
      abort?.removeEventListener('abort', done);
      resolve();
    };
    const timer = setTimeout(done, ms);
    abort?.addEventListener('abort', done, { once: true });
  });
}

/**
 * Alias of {@link createRetry} under the pre-convention name.
 *
 * Same function, same contract: it honours the runner's `AbortSignal`,
 * resolves `CNGX_ASYNC_CANCELLED` for a cancelled run, and a direct call
 * without a signal has no destroy binding.
 *
 * @deprecated Use `createRetry` - this name is removed at the v1.0 cut
 * (`with*` is reserved for provider feature functions).
 */
export const withRetry = createRetry;
