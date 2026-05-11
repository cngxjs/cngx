import { InjectionToken, type Signal } from '@angular/core';
import { isObservable, type Observable, type Subscription } from 'rxjs';

import {
  type CngxCommitController,
  type CngxCommitHandle,
} from '@cngx/common/data';

import type { CngxTabsCommitAction } from './presenter.directive';

/**
 * Adapts the shared commit-controller to the tabs action shape. The
 * presenter delegates to {@link beginTransition} when `commitAction`
 * is bound.
 */
export interface CngxTabsCommitHandler {
  /**
   * Start a tab-transition commit. Returns synchronously — read the
   * controller's `state` signal for in-flight status. `onResolve`
   * fires once with `accept = true` on success or `false` on
   * rejection; skipped on supersede.
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
 */
export interface CngxTabsCommitHandlerOptions {
  readonly controller: CngxCommitController<number>;
}

/**
 * Wraps a {@link CngxCommitController} with the action-shape adapter
 * that collapses `Observable<boolean>` / `Promise<boolean>` /
 * `boolean` returns into a single `accept: boolean` outcome.
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
    // Synchronous Observables (`of(true)`) emit inside `.subscribe` before
    // the assignment binds — close over a pre-declared `let` to avoid TDZ.
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
 * Factory signature for {@link CNGX_TABS_COMMIT_HANDLER_FACTORY}.
 * Override to wrap the default with retry-with-backoff, telemetry,
 * or offline queues.
 */
export type CngxTabsCommitHandlerFactory = (
  opts: CngxTabsCommitHandlerOptions,
) => CngxTabsCommitHandler;

/**
 * DI token for the commit-handler factory. Defaults to
 * {@link createTabsCommitHandler}. Sibling to
 * `CNGX_ARRAY_COMMIT_HANDLER_FACTORY` (select) and
 * `CNGX_STEPPER_COMMIT_HANDLER_FACTORY`.
 */
export const CNGX_TABS_COMMIT_HANDLER_FACTORY =
  new InjectionToken<CngxTabsCommitHandlerFactory>(
    'CngxTabsCommitHandlerFactory',
    {
      providedIn: 'root',
      factory: () => createTabsCommitHandler,
    },
  );
