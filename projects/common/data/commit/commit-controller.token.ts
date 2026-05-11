import { InjectionToken } from '@angular/core';

import {
  createCommitController,
  type CngxCommitController,
} from './commit-controller';

/**
 * Factory signature for producing {@link CngxCommitController}
 * instances. Consumers override the DI token
 * {@link CNGX_COMMIT_CONTROLLER_FACTORY} with a custom factory to
 * inject retry-with-backoff, offline queues, telemetry, or any
 * other enterprise-specific commit lifecycle — without forking the
 * features that consume it (select family, stepper, future wizards).
 *
 * @category interactive
 */
export type CngxCommitControllerFactory = <T>() => CngxCommitController<T>;

/**
 * DI token carrying the factory that every cngx feature uses to
 * allocate its commit controller. Default `providedIn: 'root'`
 * factory returns {@link createCommitController}. Override globally
 * via app providers or per-component via `viewProviders`.
 *
 * Symmetrical to `CNGX_SELECT_COMMIT_CONTROLLER_FACTORY`
 * (`@cngx/forms/select`); the select-side token's default factory
 * delegates to this one, so a single override here cascades into
 * every select variant transparently.
 *
 * @example
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [
 *     {
 *       provide: CNGX_COMMIT_CONTROLLER_FACTORY,
 *       useValue: <T>() => createRetryingCommitController<T>({ attempts: 3 }),
 *     },
 *   ],
 * });
 * ```
 *
 * @category interactive
 */
export const CNGX_COMMIT_CONTROLLER_FACTORY =
  new InjectionToken<CngxCommitControllerFactory>(
    'CngxCommitControllerFactory',
    {
      providedIn: 'root',
      factory: () => createCommitController,
    },
  );
