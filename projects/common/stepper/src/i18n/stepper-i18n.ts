import { inject, InjectionToken, type Provider } from '@angular/core';

/**
 * Stepper i18n surface. Library defaults are English (per
 * `feedback_en_default_locale`); German / other locales come from
 * consumer overrides via {@link provideStepperI18n}.
 *
 * Mirrors `CNGX_CHART_I18N` — the only shipped i18n precedent in
 * cngx today.
 *
 * @category interactive
 */
export interface CngxStepperI18n {
  readonly stepperLabel: string;
  readonly selectedStep: (label: string, position: number, count: number) => string;
  readonly stepCompleted: string;
  readonly stepErrored: string;
  readonly stepHasErrors: (count: number) => string;
  readonly previousStep: string;
  readonly nextStep: string;
  readonly commitFailedRetry: string;
}

const STEPPER_I18N_DEFAULTS: CngxStepperI18n = {
  stepperLabel: 'Stepper',
  selectedStep: (label, position, count) =>
    `Step ${position} of ${count}: ${label}`,
  stepCompleted: 'Completed',
  stepErrored: 'Has errors',
  stepHasErrors: (count) => `${count} error${count === 1 ? '' : 's'}`,
  previousStep: 'Previous step',
  nextStep: 'Next step',
  commitFailedRetry: 'Commit failed — retry?',
};

/**
 * DI token for the resolved stepper i18n bundle. `providedIn: 'root'`
 * with the English defaults.
 *
 * @category interactive
 */
export const CNGX_STEPPER_I18N = new InjectionToken<CngxStepperI18n>(
  'CngxStepperI18n',
  { providedIn: 'root', factory: () => STEPPER_I18N_DEFAULTS },
);

/**
 * Provider for the stepper i18n bundle. Pass a partial override —
 * unset keys fall back to the English default.
 *
 * @category interactive
 */
export function provideStepperI18n(
  overrides: Partial<CngxStepperI18n>,
): Provider {
  return {
    provide: CNGX_STEPPER_I18N,
    useValue: { ...STEPPER_I18N_DEFAULTS, ...overrides },
  };
}

/**
 * Inject the resolved stepper i18n bundle in an injection context.
 *
 * @category interactive
 */
export function injectStepperI18n(): CngxStepperI18n {
  return inject(CNGX_STEPPER_I18N);
}
