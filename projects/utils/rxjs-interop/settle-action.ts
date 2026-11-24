import { isObservable, type Observable, type Subscription } from 'rxjs';

/**
 * The three routes of {@link settleAction}. Exactly one of them is called per
 * run, and none after the handle was cancelled.
 *
 * @internal
 */
export interface SettleActionHandlers<T> {
  /** The plain value, the fulfilment value, or the first emission. */
  readonly onValue: (value: T) => void;
  /** An Observable completed without emitting. */
  readonly onEmpty: () => void;
  /** `run` threw synchronously, the thenable rejected, or the Observable errored. */
  readonly onError: (err: unknown) => void;
}

/**
 * Cancel handle of one {@link settleAction} run. Structurally assignable to
 * `CngxCommitHandle` from `@cngx/common/data`.
 *
 * @internal
 */
export interface SettleActionHandle {
  /**
   * Unsubscribes an Observable run and silences every later handler call.
   * A thenable keeps running, its outcome is dropped and a rejection is still
   * observed. Idempotent, and a no-op after the run settled.
   */
  readonly cancel: () => void;
}

/**
 * Settles one action result exactly once: a plain value, a thenable or an
 * Observable. `run` is called inside the helper, so a synchronous throw goes to
 * `onError` instead of leaving the call.
 *
 * An Observable settles on its first emission and is unsubscribed right
 * after, also when it emits synchronously inside `subscribe()` (`of`,
 * `BehaviorSubject`). A completion without an emission is its own route,
 * `onEmpty`, so each caller decides what an empty action means. A plain value
 * settles synchronously.
 *
 * The helper knows no signals, no status and no Angular; the async-state
 * factories map the three routes onto their state.
 *
 * @internal
 */
export function settleAction<T>(
  run: () => T | PromiseLike<T> | Observable<T>,
  handlers: SettleActionHandlers<T>,
): SettleActionHandle {
  let done = false;
  let subscription: Subscription | undefined;

  // Claims the single outcome; false once settled or cancelled.
  const claim = (): boolean => {
    if (done) {
      return false;
    }
    done = true;
    return true;
  };

  const handle: SettleActionHandle = {
    cancel: () => {
      done = true;
      subscription?.unsubscribe();
      subscription = undefined;
    },
  };

  let result: T | PromiseLike<T> | Observable<T>;
  try {
    result = run();
  } catch (err: unknown) {
    if (claim()) {
      handlers.onError(err);
    }
    return handle;
  }

  if (isObservable(result)) {
    const sub = result.subscribe({
      next: (value) => {
        if (!claim()) {
          return;
        }
        subscription?.unsubscribe();
        subscription = undefined;
        handlers.onValue(value);
      },
      error: (err: unknown) => {
        if (claim()) {
          handlers.onError(err);
        }
      },
      complete: () => {
        if (claim()) {
          handlers.onEmpty();
        }
      },
    });
    // A synchronous source settles before `subscribe()` returns, so the
    // teardown of its subscription can only run here.
    if (done) {
      sub.unsubscribe();
    } else {
      subscription = sub;
    }
    return handle;
  }

  if (isThenable(result)) {
    result.then(
      (value) => {
        if (claim()) {
          handlers.onValue(value);
        }
      },
      (err: unknown) => {
        if (claim()) {
          handlers.onError(err);
        }
      },
    );
    return handle;
  }

  done = true;
  handlers.onValue(result);
  return handle;
}

function isThenable<T>(value: unknown): value is PromiseLike<T> {
  return (
    value != null &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}
