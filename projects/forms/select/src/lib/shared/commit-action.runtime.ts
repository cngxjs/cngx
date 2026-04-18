import { isObservable, type Observable } from 'rxjs';

import type { CngxSelectCommitAction } from './commit-action.types';

/**
 * Handle returned by {@link runCommitAction}. Call `cancel()` to mark the
 * commit as superseded — subsequent success/error callbacks become no-ops.
 * For Observable-backed actions the underlying subscription is torn down.
 *
 * @internal
 */
export interface CngxCommitHandle {
  readonly cancel: () => void;
}

/**
 * Invokes a {@link CngxSelectCommitAction} and routes its outcome to
 * `onSuccess` / `onError`. Uniform adapter for sync values, Promises,
 * and Observables with explicit cancellation semantics.
 *
 * @internal
 */
export function runCommitAction<T>(
  action: CngxSelectCommitAction<T>,
  intended: T | undefined,
  handlers: {
    readonly onSuccess: (committed: T | undefined) => void;
    readonly onError: (error: unknown) => void;
  },
): CngxCommitHandle {
  let cancelled = false;
  let unsubscribe: (() => void) | null = null;

  const safeSuccess = (value: T | undefined): void => {
    if (cancelled) {
      return;
    }
    handlers.onSuccess(value);
  };
  const safeError = (err: unknown): void => {
    if (cancelled) {
      return;
    }
    handlers.onError(err);
  };

  let result: Observable<T | undefined> | Promise<T | undefined> | T | undefined;
  try {
    result = action(intended);
  } catch (err: unknown) {
    safeError(err);
    return { cancel: () => { cancelled = true; } };
  }

  if (isObservable(result)) {
    const sub = result.subscribe({
      // Only the first emission is a commit result. Subsequent emissions
      // are treated as noise — tear down after success so a hot source
      // cannot double-write the value signal.
      next: (value: T | undefined) => {
        safeSuccess(value);
        sub.unsubscribe();
      },
      error: (err: unknown) => safeError(err),
    });
    unsubscribe = () => sub.unsubscribe();
  } else if (result != null && typeof (result as { then?: unknown }).then === 'function') {
    (result as Promise<T | undefined>).then(safeSuccess, safeError);
  } else {
    safeSuccess(result as T | undefined);
  }

  return {
    cancel: () => {
      cancelled = true;
      unsubscribe?.();
    },
  };
}
