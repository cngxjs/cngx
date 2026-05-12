import { InjectionToken, inject } from '@angular/core';

import {
  CNGX_COMMIT_CONTROLLER_FACTORY,
  createCommitController as createGenericCommitController,
  type CngxCommitBeginHandlers,
  type CngxCommitController as CngxGenericCommitController,
} from '@cngx/common/data';

import { runCommitAction } from './commit-action.runtime';
import type { CngxSelectCommitAction } from './commit-action.types';

// Re-export lifted handler-side types so consumers that imported them
// from the select-side path keep working. Source-of-truth lives in
// @cngx/common/data.
export type {
  CngxCommitBeginHandlers,
  CngxCommitHandle,
  CngxCommitRunner,
} from '@cngx/common/data';

/**
 * Select-side commit-controller surface. Same signal/state graph as
 * the lifted {@link CngxGenericCommitController}; `begin()` accepts a
 * {@link CngxSelectCommitAction} directly. The action-shape adapter
 * keeps every existing select call-site working while
 * `@cngx/common/data` owns the generic state machine.
 */
export interface CngxCommitController<T>
  extends Omit<CngxGenericCommitController<T>, 'begin'> {
  /**
   * Start a new commit. Supersedes any in-flight commit: prior callbacks
   * become no-ops, prior Observable subscriptions are torn down.
   *
   * @param action   async write handler (Observable/Promise/sync)
   * @param intended value the user clicked
   * @param previous rollback target on error
   * @param handlers success/error routes. Controller updates its own
   *                 state and calls these; never touches `value`, panel
   *                 open state, or outputs.
   */
  begin(
    action: CngxSelectCommitAction<T>,
    intended: T | undefined,
    previous: T | undefined,
    handlers: CngxCommitBeginHandlers<T>,
  ): void;
}

/**
 * Wraps a generic {@link CngxGenericCommitController} with the
 * select-side action-shape adapter. {@link runCommitAction} handles
 * Observable/Promise/sync results and routes through the generic
 * controller's runner-callback `begin`.
 *
 * @internal
 */
function wrapAsSelectController<T>(
  generic: CngxGenericCommitController<T>,
): CngxCommitController<T> {
  return {
    state: generic.state,
    isCommitting: generic.isCommitting,
    intendedValue: generic.intendedValue,
    cancel: () => generic.cancel(),
    begin(action, intended, previous, handlers) {
      generic.begin(
        (runnerHandlers) =>
          runCommitAction<T>(action, intended, runnerHandlers),
        intended,
        previous,
        handlers,
      );
    },
  };
}

/**
 * Direct (non-DI) factory for a select-side commit controller. Wraps a
 * fresh generic controller with the action-shape adapter; bypasses
 * {@link CNGX_COMMIT_CONTROLLER_FACTORY}. Use
 * {@link CNGX_SELECT_COMMIT_CONTROLLER_FACTORY} for DI-aware
 * resolution.
 */
export function createCommitController<T>(): CngxCommitController<T> {
  return wrapAsSelectController(createGenericCommitController<T>());
}

/**
 * Factory signature for {@link CngxCommitController} instances scoped
 * to the select family. Override this token (retry-with-backoff,
 * offline queues, telemetry) without touching call sites.
 */
export type CngxSelectCommitControllerFactory = <T>() => CngxCommitController<T>;

/**
 * DI token for the per-variant commit-controller factory. Default
 * resolves to {@link createCommitController}. Override on
 * {@link CNGX_COMMIT_CONTROLLER_FACTORY} to swap the state machine for
 * every cngx feature; override on this token to swap only the select
 * family.
 *
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [
 *     {
 *       provide: CNGX_SELECT_COMMIT_CONTROLLER_FACTORY,
 *       useValue: <T>() => createRetryingCommitController<T>({ attempts: 3 }),
 *     },
 *   ],
 * });
 * ```
 */
export const CNGX_SELECT_COMMIT_CONTROLLER_FACTORY =
  new InjectionToken<CngxSelectCommitControllerFactory>(
    'CngxSelectCommitControllerFactory',
    {
      providedIn: 'root',
      factory: () => {
        // Bind the generic factory at injection time so an override on
        // CNGX_COMMIT_CONTROLLER_FACTORY cascades transparently into
        // every select variant. Returned factory wraps each generic
        // controller with the action-shape adapter on demand.
        const genericFactory = inject(CNGX_COMMIT_CONTROLLER_FACTORY);
        return <T>() => wrapAsSelectController(genericFactory<T>());
      },
    },
  );
