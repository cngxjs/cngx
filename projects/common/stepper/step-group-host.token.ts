import { InjectionToken } from '@angular/core';

import type { CngxStepRegistration } from './stepper-host.token';

/**
 * Contract a `CngxStep` sees when it injects a parent group via
 * {@link CNGX_STEP_GROUP_HOST}. Mirrors the presenter's `register` /
 * `unregister` so atoms stay agnostic of root vs. nested host.
 *
 * Surface is registration-only — `id` and `aggregatedStatus` are
 * concrete-class details, not part of the token contract.
 *
 * @category common/stepper
 */
export interface CngxStepGroupHost {
  register(handle: CngxStepRegistration): void;
  unregister(id: string): void;
}

/**
 * DI token providing a `CngxStepGroup`'s contract to nested `CngxStep` atoms.
 * Steps inject this `optional: true` and fall back to {@link CNGX_STEPPER_HOST}.
 *
 * @category common/stepper
 */
export const CNGX_STEP_GROUP_HOST = new InjectionToken<CngxStepGroupHost>(
  'CngxStepGroupHost',
);
