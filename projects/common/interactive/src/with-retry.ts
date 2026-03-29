import { computed, signal, type Signal } from '@angular/core';
import { buildAsyncStateView, type AsyncStatus, type CngxAsyncState } from '@cngx/core/utils';
import { firstValueFrom, isObservable, timer } from 'rxjs';

import type { AsyncAction } from './async-click.directive';

/** Configuration for `withRetry()`. */
export interface RetryConfig {
  /** Maximum number of attempts (including the first). Default: `3`. */
  maxAttempts?: number;
  /** Base delay in ms between retries. Default: `1000`. */
  delay?: number;
  /** Backoff strategy. `'exponential'` doubles the delay each attempt. Default: `'exponential'`. */
  backoff?: 'linear' | 'exponential';
}

/** State exposed by the retryable action — read-only signals for UI feedback. */
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
   * `retrying` (delay between retries) maps to `'pending'` — the feedback
   * system sees "still working" during retry delays.
   */
  readonly state: CngxAsyncState<unknown>;
  /** Manually reset — clears exhausted state, resets attempt counter. */
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
 * const [saveWithRetry, retryState] = withRetry(
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
 * @category interactive
 */
export function withRetry(action: AsyncAction, config?: RetryConfig): [AsyncAction, RetryState] {
  const maxAttempts = config?.maxAttempts ?? 3;
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

  const retryState: RetryState = {
    attempt: attemptState.asReadonly(),
    maxAttempts: computed(() => maxAttempts),
    retrying: retryingState.asReadonly(),
    exhausted: exhaustedState.asReadonly(),
    lastError: lastErrorState.asReadonly(),
    state: asyncState,
    reset() {
      attemptState.set(0);
      retryingState.set(false);
      exhaustedState.set(false);
      succeededState.set(false);
      lastErrorState.set(undefined);
    },
  };

  const retryableAction: AsyncAction = async () => {
    attemptState.set(0);
    retryingState.set(false);
    exhaustedState.set(false);
    succeededState.set(false);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      attemptState.set(attempt);

      try {
        const result$ = action();
        if (isObservable(result$)) {
          await firstValueFrom(result$, { defaultValue: undefined });
        } else {
          await result$;
        }
        // Success — clear retry state
        retryingState.set(false);
        succeededState.set(true);
        return;
      } catch (err: unknown) {
        lastErrorState.set(err);

        if (attempt >= maxAttempts) {
          // All attempts exhausted — propagate the error
          exhaustedState.set(true);
          retryingState.set(false);
          throw err;
        }

        // Wait before next attempt
        retryingState.set(true);
        const delayMs =
          backoff === 'exponential' ? baseDelay * Math.pow(2, attempt - 1) : baseDelay * attempt;
        await firstValueFrom(timer(delayMs), { defaultValue: undefined });
        retryingState.set(false);
      }
    }
  };

  return [retryableAction, retryState];
}
