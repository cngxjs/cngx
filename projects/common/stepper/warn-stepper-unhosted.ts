import { afterNextRender } from '@angular/core';
import { cngxDevWarn } from '@cngx/utils';

/**
 * Dev-warning for a stepper control (`[cngxStepperNext]`,
 * `[cngxStepperPrevious]`, `[cngxStepperComplete]`, `<cngx-stepper-count>`)
 * that has neither a bound `[host]` nor an ambient stepper presenter. Such a
 * control stays disabled or empty for good, so it warns once per instance
 * after the first render, when the `[host]` binding has settled. Call it from
 * an injection context.
 *
 * @internal
 */
export function warnStepperControlUnhosted(selector: string, host: () => unknown): void {
  if (!(typeof ngDevMode !== 'undefined' && ngDevMode)) {
    return;
  }
  afterNextRender(() => {
    if (host()) {
      return;
    }
    cngxDevWarn(
      'CNGX1056',
      `[${selector}] has no stepper. Place it inside a stepper, or bind [host] to the ` +
        `stepper's presenter when it sits outside.`,
    );
  });
}
