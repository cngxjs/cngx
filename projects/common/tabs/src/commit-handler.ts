import { InjectionToken, type Signal } from '@angular/core';
import { isObservable, type Observable, type Subscription } from 'rxjs';

import {
  type CngxCommitController,
  type CngxCommitHandle,
} from '@cngx/common/data';

import type { CngxTabsCommitAction } from './presenter.directive';

/**
 * Outcome bridge between the lifted commit-controller and the
 * tabs-specific action shape. The presenter delegates to
 * {@link beginTransition} whenever the user triggers a tab change
 * while `commitAction` is non-null.
 *
 * @category interactive/tabs
 */
export interface CngxTabsCommitHandler {
  /**
   * Start a tab-transition commit. Returns synchronously; the
   * controller's `state` signal reports the in-flight status.
   *
   * @param fromIndex origin tab index (the tab the user is leaving)
   * @param toIndex   target tab index
   * @param action    the consumer-supplied action to invoke
   * @param onResolve callback fired on success (`accept = true`)
   *                  or rejection (`accept = false`); skipped on
   *                  supersede.
   */
  beginTransition(
    fromIndex: number,
    toIndex: number,
    action: CngxTabsCommitAction,
    onResolve: (accept: boolean) => void,
  ): void;

  /** Cancel the in-flight transition without firing callbacks. */
  cancel(): void;

  /** Live `pending` flag from the controller. */
  readonly isCommitting: Signal<boolean>;
}

/**
 * Options for {@link createTabsCommitHandler}.
 *
 * @category interactive
 */
export interface CngxTabsCommitHandlerOptions {
  readonly controller: CngxCommitController<number>;
}

/**
 * Build a tabs commit handler over an existing
 * {@link CngxCommitController}. Wraps the controller's runner-
 * callback `begin` with the action-shape adapter that resolves
 * `Observable<boolean>` / `Promise<boolean>` / `boolean` returns
 * into a unified `accept: boolean` outcome.
 *
 * @category interactive
 */
export function createTabsCommitHandler(
  opts: CngxTabsCommitHandlerOptions,
): CngxTabsCommitHandler {
  const { controller } = opts;
  return {
    isCommitting: controller.isCommitting,

    beginTransition(fromIndex, toIndex, action, onResolve) {
      controller.begin(
        (handlers) => runTabsAction(action, fromIndex, toIndex, handlers),
        toIndex,
        fromIndex,
        {
          onSuccess: () => onResolve(true),
          onError: () => onResolve(false),
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
      handlers.onError(new Error('Tab transition refused by commitAction'));
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
    // Synchronous Observables (`of(true)`) emit inside `.subscribe`
    // before the assignment binds — `sub` is in TDZ if we close
    // over it directly. Hold the handle on `let` declared first.
    let sub: Subscription | null = null;
    sub = result.subscribe({
      next: (accept) => {
        safeSuccess(accept);
        sub?.unsubscribe();
      },
      error: (err: unknown) => safeError(err),
    });
    unsubscribe = () => sub?.unsubscribe();
  } else if (
    result != null &&
    typeof (result as { then?: unknown }).then === 'function'
  ) {
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
 * Factory signature for producing {@link CngxTabsCommitHandler}
 * instances. Consumers override the DI token
 * {@link CNGX_TABS_COMMIT_HANDLER_FACTORY} to wrap the default
 * with retry-with-backoff, telemetry, or offline queues.
 *
 * @category interactive
 */
export type CngxTabsCommitHandlerFactory = (
  opts: CngxTabsCommitHandlerOptions,
) => CngxTabsCommitHandler;

/**
 * DI token carrying the factory the presenter uses to allocate its
 * commit handler. Default `providedIn: 'root'` factory returns
 * {@link createTabsCommitHandler}. Symmetrical to the select
 * family's `CNGX_ARRAY_COMMIT_HANDLER_FACTORY` and the stepper's
 * `CNGX_STEPPER_COMMIT_HANDLER_FACTORY`.
 *
 * @category interactive
 */
export const CNGX_TABS_COMMIT_HANDLER_FACTORY =
  new InjectionToken<CngxTabsCommitHandlerFactory>(
    'CngxTabsCommitHandlerFactory',
    {
      providedIn: 'root',
      factory: () => createTabsCommitHandler,
    },
  );
