import { InjectionToken, type Signal } from '@angular/core';
import { isObservable, type Observable, type Subscription } from 'rxjs';

import {
  type CngxCommitController,
  type CngxCommitHandle,
} from '@cngx/common/data';

import type { CngxStepperCommitAction } from './presenter.directive';

/**
 * Adapter between the lifted commit-controller and the stepper's
 * action shape. The presenter delegates to `beginTransition` on
 * every step change driven by `commitAction`.
 */
export interface CngxStepperCommitHandler {
  /**
   * Start a transition commit. Returns synchronously; the controller's
   * `state` signal reports the in-flight status.
   *
   * @param onResolve fires `true` on accept, `false` on rejection;
   *                  skipped on supersede.
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
 */
export interface CngxStepperCommitHandlerOptions {
  readonly controller: CngxCommitController<number>;
}

/**
 * Build a stepper commit handler over an existing {@link CngxCommitController}.
 * Resolves `Observable<boolean>` / `Promise<boolean>` / `boolean` returns into
 * a unified `accept: boolean` outcome.
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
    // Synchronous Observables (`of(true)`) emit inside `.subscribe`
    // before the assignment binds — `sub` would be in TDZ. Declare
    // the handle on a `let` first.
    let sub: Subscription | null = null;
    sub = result.subscribe({
      next: (accept) => {
        safeSuccess(accept);
        sub?.unsubscribe();
      },
      error: (err: unknown) => safeError(err),
    });
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
 * Factory signature for {@link CngxStepperCommitHandler}. Override
 * {@link CNGX_STEPPER_COMMIT_HANDLER_FACTORY} for retry-with-backoff,
 * telemetry, or offline queues.
 */
export type CngxStepperCommitHandlerFactory = (
  opts: CngxStepperCommitHandlerOptions,
) => CngxStepperCommitHandler;

/**
 * DI token carrying the factory the presenter uses to allocate its commit
 * handler. Symmetric to the select family's `CNGX_ARRAY_COMMIT_HANDLER_FACTORY`.
 */
export const CNGX_STEPPER_COMMIT_HANDLER_FACTORY =
  new InjectionToken<CngxStepperCommitHandlerFactory>(
    'CngxStepperCommitHandlerFactory',
    {
      providedIn: 'root',
      factory: () => createStepperCommitHandler,
    },
  );
