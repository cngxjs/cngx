import { InjectionToken, inject } from '@angular/core';

import {
  CNGX_COMMIT_CONTROLLER_FACTORY,
  createCommitController as createGenericCommitController,
  type CngxCommitBeginHandlers,
  type CngxCommitController as CngxGenericCommitController,
} from '@cngx/common/data';

import { runCommitAction } from './commit-action.runtime';
import type { CngxSelectCommitAction } from './commit-action.types';

// Re-export the lifted handler-side types so consumers that imported
// them through the historical select-side path keep working without
// edits. Source-of-truth for the lifted symbols lives in
// @cngx/common/data.
export type {
  CngxCommitBeginHandlers,
  CngxCommitHandle,
  CngxCommitRunner,
} from '@cngx/common/data';

/**
 * Select-side commit-controller surface. Identical signal/state graph
 * as the lifted {@link CngxGenericCommitController}, but `begin()`
 * accepts a {@link CngxSelectCommitAction} directly — the select
 * family pre-dates the lift and every variant + every commit-handler
 * inside `forms/select` calls this signature. Wrapping the generic
 * controller with an action-shape adapter keeps zero call-site
 * rewrites required while still letting `@cngx/common/data` own the
 * generic state machine.
 *
 * @category interactive
 */
export interface CngxCommitController<T>
  extends Omit<CngxGenericCommitController<T>, 'begin'> {
  /**
   * Start a new commit. Supersedes any in-flight commit: the previous
   * one's callbacks will be no-ops, and if the previous action was an
   * Observable, its subscription is torn down.
   *
   * @param action   the async write handler (Observable/Promise/sync)
   * @param intended the value the user clicked
   * @param previous the value to roll back to on error
   * @param handlers success/error routes — the controller only updates
   *                 its own state and calls these; it does NOT touch
   *                 `value`, panel open state, or outputs.
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
 * select-side action-shape adapter. The runtime adapter
 * ({@link runCommitAction}) handles Observable/Promise/sync action
 * results and routes them through the generic controller's runner-
 * callback `begin`.
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
 * Factory for the select-side commit controller. Wraps a freshly-
 * allocated generic controller with the action-shape adapter. Direct
 * (non-DI) usage; bypasses the {@link CNGX_COMMIT_CONTROLLER_FACTORY}
 * token. For DI-aware usage that respects override cascades, inject
 * {@link CNGX_SELECT_COMMIT_CONTROLLER_FACTORY} instead.
 *
 * @category interactive
 */
export function createCommitController<T>(): CngxCommitController<T> {
  return wrapAsSelectController(createGenericCommitController<T>());
}

/**
 * Factory signature for producing {@link CngxCommitController}
 * instances scoped to the select family. Identical shape pre/post
 * lift; consumers that override this token with a custom factory
 * (retry-with-backoff, offline queues, telemetry) keep working
 * unchanged.
 *
 * @category interactive
 */
export type CngxSelectCommitControllerFactory = <T>() => CngxCommitController<T>;

/**
 * DI token carrying the factory that every select variant uses to
 * allocate its commit controller. Default `providedIn: 'root'`
 * factory returns {@link createCommitController} (the select-side
 * wrapper). Override globally via app providers or per-component via
 * `viewProviders`.
 *
 * Symmetrical to {@link CNGX_COMMIT_CONTROLLER_FACTORY} from
 * `@cngx/common/data`: a single override on either token cascades
 * appropriately — override the generic token to swap the underlying
 * state machine for every cngx feature; override this select-specific
 * token to swap only the select family while leaving stepper / future
 * features on the default machine.
 *
 * @example
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
 *
 * @category interactive
 */
export const CNGX_SELECT_COMMIT_CONTROLLER_FACTORY =
  new InjectionToken<CngxSelectCommitControllerFactory>(
    'CngxSelectCommitControllerFactory',
    {
      providedIn: 'root',
      factory: () => {
        // Bind the generic factory at injection time so an override
        // on CNGX_COMMIT_CONTROLLER_FACTORY cascades transparently
        // into every select variant. The returned select-side
        // factory wraps each generic controller with the action-
        // shape adapter on demand.
        const genericFactory = inject(CNGX_COMMIT_CONTROLLER_FACTORY);
        return <T>() => wrapAsSelectController(genericFactory<T>());
      },
    },
  );
