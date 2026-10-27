import { InjectionToken, type Signal } from '@angular/core';
import { isObservable, type Observable, type Subscription } from 'rxjs';

import { type CngxCommitController, type CngxCommitHandle } from '@cngx/common/data';
import { CngxRuntimeError } from '@cngx/utils';

import type { CngxTabsCommitAction } from './presenter.directive';

/**
 * How a commit-gated tab switch settled. `'refused'` is a `false` answer
 * from `commitAction` (the action declined on purpose, nothing failed);
 * `'failed'` is a throw, a rejected promise or an erroring observable.
 */
export type CngxTabsCommitResolution = 'accepted' | 'refused' | 'failed';

/**
 * Adapts the shared commit-controller to the tabs action shape. \
 * The presenter delegates to {@link beginTransition} when `commitAction`
 * is bound.
 */
export interface CngxTabsCommitHandler {
  /**
   * Start a tab-transition commit. \
   * Returns synchronously - read the
   * controller's `state` signal for in-flight status. `onResolve`
   * fires once: `'accepted'` when the action answers `true`,
   * `'refused'` when it answers `false`, `'failed'` when it throws,
   * rejects or errors; skipped on supersede.
   */
  beginTransition(
    fromIndex: number,
    toIndex: number,
    action: CngxTabsCommitAction,
    onResolve: (outcome: CngxTabsCommitResolution) => void,
  ): void;

  /** Cancel the in-flight transition without firing callbacks. */
  cancel(): void;

  /** Live `pending` flag from the controller. */
  readonly isCommitting: Signal<boolean>;
}

/**
 * Options for {@link createTabsCommitHandler}.
 */
export interface CngxTabsCommitHandlerOptions {
  readonly controller: CngxCommitController<number>;
}

/**
 * Wraps a {@link CngxCommitController} with the action-shape adapter
 * that resolves `Observable<boolean>` / `Promise<boolean>` / `boolean`
 * returns into one {@link CngxTabsCommitResolution}: `true` accepts,
 * `false` refuses (the controller settles to `'idle'` and stores no
 * error), a throw fails.
 */
export function createTabsCommitHandler(opts: CngxTabsCommitHandlerOptions): CngxTabsCommitHandler {
  const { controller } = opts;
  return {
    isCommitting: controller.isCommitting,

    beginTransition(fromIndex, toIndex, action, onResolve) {
      controller.begin(
        (handlers) => runTabsAction(action, fromIndex, toIndex, handlers),
        toIndex,
        fromIndex,
        {
          onSuccess: () => onResolve('accepted'),
          onError: () => onResolve('failed'),
          onRefused: () => onResolve('refused'),
        },
      );
    },

    cancel() {
      controller.cancel();
    },
  };
}

function runTabsAction(
  action: CngxTabsCommitAction,
  fromIndex: number,
  toIndex: number,
  handlers: {
    readonly onSuccess: (committed: number | undefined) => void;
    readonly onError: (err: unknown) => void;
    readonly onRefused: () => void;
  },
): CngxCommitHandle {
  let cancelled = false;
  let unsubscribe: (() => void) | null = null;

  const safeSuccess = (accept: boolean): void => {
    if (cancelled) {
      return;
    }
    if (accept) {
      handlers.onSuccess(toIndex);
    } else {
      handlers.onRefused();
    }
  };
  const safeError = (err: unknown): void => {
    if (cancelled) {
      return;
    }
    handlers.onError(err);
  };

  let result: boolean | Promise<boolean> | Observable<boolean>;
  try {
    result = action(fromIndex, toIndex);
  } catch (err: unknown) {
    safeError(err);
    return {
      cancel: () => {
        cancelled = true;
      },
    };
  }

  if (isObservable(result)) {
    // Synchronous Observables (`of(true)`) emit inside `.subscribe` before
    // the assignment binds - close over a pre-declared `let` to avoid TDZ.
    let sub: Subscription | null = null;
    let done = false;
    sub = result.subscribe({
      next: (accept) => {
        if (done) {
          return;
        }
        // Done-latch, not just unsubscribe: a synchronous emission fires
        // while `sub` is still null, so a non-completing source would
        // otherwise stay live and re-resolve on its next emission.
        done = true;
        safeSuccess(accept);
        sub?.unsubscribe();
      },
      error: (err: unknown) => {
        if (done) {
          return;
        }
        safeError(err);
      },
      complete: () => {
        // EMPTY-style sources complete without emitting; without this arm
        // the commit stays 'pending' forever and busy() latches true.
        if (!done) {
          safeError(
            new CngxRuntimeError(
              'CNGX1059',
              typeof ngDevMode !== 'undefined' &&
                ngDevMode &&
                '[cngxTabGroup] commitAction completed without emitting true or false.',
            ),
          );
        }
      },
    });
    if (done) {
      // The in-next unsubscribe was a no-op for a sync emission; close
      // the still-live subscription now that `sub` is bound.
      sub.unsubscribe();
    }
    unsubscribe = () => sub?.unsubscribe();
  } else if (result != null && typeof (result as { then?: unknown }).then === 'function') {
    (result as Promise<boolean>).then(safeSuccess, safeError);
  } else {
    safeSuccess(result as boolean);
  }

  return {
    cancel: () => {
      cancelled = true;
      unsubscribe?.();
    },
  };
}

/**
 * Factory signature for {@link CNGX_TABS_COMMIT_HANDLER_FACTORY}.
 * Override to wrap the default with retry-with-backoff, telemetry,
 * or offline queues.
 */
export type CngxTabsCommitHandlerFactory = (
  opts: CngxTabsCommitHandlerOptions,
) => CngxTabsCommitHandler;

/**
 * DI token for the commit-handler factory. \
 * Defaults to {@link createTabsCommitHandler}. \
 * Sibling to
 * - `CNGX_ARRAY_COMMIT_HANDLER_FACTORY` (select) and
 * - `CNGX_STEPPER_COMMIT_HANDLER_FACTORY`.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/tabs/commit-handler.ts
 * @since 0.1.0
 */
export const CNGX_TABS_COMMIT_HANDLER_FACTORY = new InjectionToken<CngxTabsCommitHandlerFactory>(
  'CngxTabsCommitHandlerFactory',
  {
    providedIn: 'root',
    factory: () => createTabsCommitHandler,
  },
);
