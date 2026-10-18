import { computed, inject, isSignal, signal, type Provider } from '@angular/core';

import type { CngxTransitionOutcome } from '@cngx/common/data';
import {
  CNGX_STEPPER_HOST,
  CngxStepperPresenter,
  type CngxStepperHost,
} from '@cngx/common/stepper';

/**
 * Spec seam for the skins without a `commitAction` input (dot, text,
 * progress-bar): re-provides `CNGX_STEPPER_HOST` as the real presenter with
 * `lastOutcome` / `lastFailedIndex` driven by {@link stepperOutcome}, so a
 * refused or failed commit can be staged without a commit window.
 *
 * One module-level signal on purpose: under `isolate: false` a component
 * provider override can outlive its test, so every override must read the
 * same source, and `stepperOutcome.set(undefined)` in `afterEach` returns a
 * leaked override to the real presenter's behaviour (these skins never open
 * a commit window, so their real outcome is always `undefined`).
 *
 * @internal
 */
export const stepperOutcome = signal<CngxTransitionOutcome | undefined>(undefined);

const stagedFailedIndex = computed(() => stepperOutcome()?.index);

/** @internal */
export const STEPPER_OUTCOME_SEAM: Provider = {
  provide: CNGX_STEPPER_HOST,
  useFactory: (): CngxStepperHost => {
    const real = inject(CngxStepperPresenter);
    return new Proxy(real, {
      get(target, key) {
        if (key === 'lastOutcome') {
          return stepperOutcome;
        }
        if (key === 'lastFailedIndex') {
          return stagedFailedIndex;
        }
        const value: unknown = Reflect.get(target, key, target);
        if (typeof value === 'function' && !isSignal(value)) {
          return (value as (...args: unknown[]) => unknown).bind(target);
        }
        return value;
      },
    });
  },
};
