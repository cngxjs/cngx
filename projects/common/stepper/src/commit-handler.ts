import { InjectionToken, type Signal } from '@angular/core';
import { isObservable, type Observable } from 'rxjs';

import {
  type CngxCommitController,
  type CngxCommitHandle,
} from '@cngx/common/data';

import type { CngxStepperCommitAction } from './presenter.directive';

/**
 * Outcome bridge between the lifted commit-controller and the
 * stepper-specific action shape. Consumers configure the handler
 * via the `commitAction` Input on the presenter; the presenter
 * delegates to `beginTransition` whenever the user attempts a
 * step change.
 *
 * @category interactive
 */
export interface CngxStepperCommitHandler {
  /**
   * Start a transition commit. Returns synchronously; the
   * controller's `state` signal reports the in-flight status.
   *
   * @param fromIndex origin step index (the step the user is
   *                  leaving)
   * @param toIndex   target step index
   * @param action    the consumer-supplied action to invoke
   * @param onResolve callback fired on success (`accept = true`)
   *                  or rejection (`accept = false`); skipped on
   *                  supersede.
   */
  beginTransition(
    fromIndex: number,
    toIndex: number,
    action: CngxStepperCommitAction,
    onResolve: (accept: boolean) => void,
  ): void;

  /** Cancel the in-flight transition without firing callbacks. */
  cancel(): void;

  /** Live `pending` flag from the controller. */
  readonly isCommitting: Signal<boolean>;
}

/**
 * Options for {@link createStepperCommitHandler}.
 *
 * @category interactive
 */
export interface CngxStepperCommitHandlerOptions {
  readonly controller: CngxCommitController<number>;
}

/**
 * Build a stepper commit handler over an existing
 * {@link CngxCommitController}. Wraps the controller's runner-
 * callback `begin` with the action-shape adapter that resolves
 * `Observable<boolean>` / `Promise<boolean>` / `boolean` returns
 * into a unified `accept: boolean` outcome.
 *
 * @category interactive
 */
export function createStepperCommitHandler(
  opts: CngxStepperCommitHandlerOptions,
): CngxStepperCommitHandler {
  const { controller } = opts;
  return {
    isCommitting: controller.isCommitting,

    beginTransition(fromIndex, toIndex, action, onResolve) {
      controller.begin(
        (handlers) => runStepperAction(action, fromIndex, toIndex, handlers),
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

function runStepperAction(
  action: CngxStepperCommitAction,
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
      handlers.onError(new Error('Stepper transition refused by commitAction'));
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
    return { cancel: () => { cancelled = true; } };
  }

  if (isObservable(result)) {
    const sub = result.subscribe({
      next: (accept) => {
        safeSuccess(accept);
        sub.unsubscribe();
      },
      error: (err: unknown) => safeError(err),
    });
    unsubscribe = () => sub.unsubscribe();
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
 * Factory signature for producing {@link CngxStepperCommitHandler}
 * instances. Consumers override the DI token
 * {@link CNGX_STEPPER_COMMIT_HANDLER_FACTORY} to wrap the default
 * with retry-with-backoff, telemetry, or offline queues.
 *
 * @category interactive
 */
export type CngxStepperCommitHandlerFactory = (
  opts: CngxStepperCommitHandlerOptions,
) => CngxStepperCommitHandler;

/**
 * DI token carrying the factory the presenter uses to allocate its
 * commit handler. Default `providedIn: 'root'` factory returns
 * {@link createStepperCommitHandler}. Symmetrical to the select
 * family's `CNGX_ARRAY_COMMIT_HANDLER_FACTORY`.
 *
 * @category interactive
 */
export const CNGX_STEPPER_COMMIT_HANDLER_FACTORY =
  new InjectionToken<CngxStepperCommitHandlerFactory>(
    'CngxStepperCommitHandlerFactory',
    {
      providedIn: 'root',
      factory: () => createStepperCommitHandler,
    },
  );
