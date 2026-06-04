import { isObservable, type Observable } from 'rxjs';

import type { CngxSelectCommitAction } from './commit-action.types';

/**
 * Cancel marks the commit superseded. Observable subscriptions tear down;
 * sync/Promise resolutions become no-ops.
 *
 * @internal
 */
export interface CngxCommitHandle {
  readonly cancel: () => void;
}

/**
 * Invokes a {@link CngxSelectCommitAction} and routes the outcome to
 * `onSuccess`/`onError`. Handles sync, Promise, and Observable shapes.
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
      // First emission only — tear down so a hot source can't
      // double-write the value signal.
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
