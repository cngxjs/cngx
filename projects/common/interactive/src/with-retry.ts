import { signal, type Signal } from '@angular/core';
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
  /** Manually trigger a retry (resets exhausted state). */
  reset(): void;
}

/**
 * Wraps an `AsyncAction` with automatic retry logic.
 *
 * Returns a tuple: `[action, state]` where `action` is a new `AsyncAction`
 * that retries on failure, and `state` exposes attempt/retry signals for UI feedback.
 *
 * Composes naturally with `CngxAsyncClick` and `CngxActionButton`:
 *
 * ```typescript
 * const [saveWithRetry, retryState] = withRetry(
 *   () => this.http.post('/api/save', data),
 *   { maxAttempts: 3, delay: 1000, backoff: 'exponential' }
 * );
 *
 * // Use with CngxAsyncClick
 * <button [cngxAsyncClick]="saveWithRetry">Save</button>
 * <span>Attempt {{ retryState.attempt() }} / {{ retryState.maxAttempts() }}</span>
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
  const lastErrorState = signal<unknown>(null);

  const state: RetryState = {
    attempt: attemptState.asReadonly(),
    maxAttempts: signal(maxAttempts).asReadonly(),
    retrying: retryingState.asReadonly(),
    exhausted: exhaustedState.asReadonly(),
    lastError: lastErrorState.asReadonly(),
    reset() {
      attemptState.set(0);
      retryingState.set(false);
      exhaustedState.set(false);
      lastErrorState.set(null);
    },
  };

  const retryableAction: AsyncAction = async () => {
    attemptState.set(0);
    exhaustedState.set(false);

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

  return [retryableAction, state];
}
