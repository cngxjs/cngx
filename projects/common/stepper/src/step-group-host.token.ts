import { InjectionToken } from '@angular/core';

import type { CngxStepRegistration } from './stepper-host.token';

/**
 * Public contract a `CngxStep` sees when it injects a parent group
 * via {@link CNGX_STEP_GROUP_HOST}. The group's `register` mirrors
 * the presenter's surface so atoms can be agnostic about whether
 * they're rooted at the presenter or nested inside a group.
 *
 * Surface is intentionally minimal — only the registration
 * lifecycle. The group's own `id` / `aggregatedStatus` are
 * concrete-class details (used by the status roll-up and the
 * registration-forwarding chain) but no cross-component consumer
 * needs them through the token.
 *
 * @category interactive
 */
export interface CngxStepGroupHost {
  register(handle: CngxStepRegistration): void;
  unregister(id: string): void;
}

/**
 * DI token providing a `CngxStepGroup`'s contract to nested
 * `CngxStep` atoms. The group provides this via `useExisting`;
 * nested steps `inject(CNGX_STEP_GROUP_HOST, { optional: true })`
 * before falling back to {@link CNGX_STEPPER_HOST}.
 *
 * @category interactive
 */
export const CNGX_STEP_GROUP_HOST = new InjectionToken<CngxStepGroupHost>(
  'CngxStepGroupHost',
);
