import { inject, InjectionToken, type Provider } from '@angular/core';

/**
 * Stepper i18n surface. Library defaults are English; locales come from
 * consumer overrides via {@link provideStepperI18n}. Sibling of
 * `CNGX_TABS_I18N` / `CNGX_CHART_I18N`.
 */
export interface CngxStepperI18n {
  readonly stepperLabel: string;
  readonly selectedStep: (label: string, position: number, count: number) => string;
  readonly stepCompleted: string;
  readonly stepErrored: string;
  readonly stepHasErrors: (count: number) => string;
  readonly previousStep: string;
  readonly nextStep: string;
  /**
   * @deprecated Superseded by {@link commitRolledBackTo}. Retained as
   * defensive fallback in `liveAnnouncement` when the origin label is
   * unresolvable (unlabeled step, or `commitState` driven outside `select()`).
   */
  readonly commitFailedRetry: string;
  /**
   * Polite SR announcement on `idle → pending`. Pillar 2.
   */
  readonly commitInFlight: string;
  /**
   * Origin-aware rollback phrase. Read on `pending → error` when both
   * `lastFailedIndex` and `originIndexDuringCommit` resolve. Receives
   * the safe-harbour label, yields e.g. `Reverted to step "Customer".`.
   */
  readonly commitRolledBackTo: (originLabel: string) => string;
  /**
   * Persistent suffix on the per-step `aria-describedby` while
   * `presenter.lastFailedIndex()` matches the step. Distinct from
   * {@link commitRolledBackTo} (transient live-region phrase) — this
   * suffix is reachable when AT users navigate back to the rejected
   * step after the announcement has faded. Pillar 2.
   */
  readonly stepRolledBackSuffix: string;
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
  commitInFlight: 'Committing step…',
  commitRolledBackTo: (originLabel) => `Reverted to step "${originLabel}".`,
  stepRolledBackSuffix: 'This step was rolled back.',
};

/**
 * DI token for the resolved stepper i18n bundle. `providedIn: 'root'`
 * with English defaults.
 */
export const CNGX_STEPPER_I18N = new InjectionToken<CngxStepperI18n>(
  'CngxStepperI18n',
  { providedIn: 'root', factory: () => STEPPER_I18N_DEFAULTS },
);

/**
 * Feature shape consumed by {@link provideStepperI18n} and {@link provideCngxStepper}.
 * Hidden `_target: 'i18n'` discriminator routes through the family aggregator.
 * Sibling of `CngxTabsI18nFeature`.
 */
export type CngxStepperI18nFeature = ((
  bundle: CngxStepperI18n,
) => CngxStepperI18n) & {
  readonly _target: 'i18n';
};

/**
 * Brands an i18n mutator with `_target: 'i18n'`. Every `with*` i18n
 * feature returns one of these.
 *
 * @internal
 */
function defineStepperI18nFeature(
  fn: (bundle: CngxStepperI18n) => CngxStepperI18n,
): CngxStepperI18nFeature {
  return Object.assign(fn, { _target: 'i18n' as const });
}

/**
 * Override stepper i18n labels. Partial override — unset keys keep
 * the English default. Sibling of `withStepperAriaLabels` /
 * `withStepperFallbackLabels`.
 */
export function withStepperI18nLabels(
  overrides: Partial<CngxStepperI18n>,
): CngxStepperI18nFeature {
  return defineStepperI18nFeature((bundle) => ({ ...bundle, ...overrides }));
}

function resolveI18nFeatures(
  features: readonly CngxStepperI18nFeature[],
): CngxStepperI18n {
  return features.reduce<CngxStepperI18n>(
    (bundle, feat) => feat(bundle),
    STEPPER_I18N_DEFAULTS,
  );
}

/**
 * Provider for the stepper i18n bundle. Compose `withStepperI18nLabels(...)`
 * (plus any future i18n `with*`) — unset keys fall back to English.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideStepperI18n(
 *       withStepperI18nLabels({ stepperLabel: 'Schrittfolge', previousStep: 'Vorheriger' }),
 *     ),
 *   ],
 * });
 * ```
 */
export function provideStepperI18n(
  ...features: readonly CngxStepperI18nFeature[]
): Provider {
  return {
    provide: CNGX_STEPPER_I18N,
    useValue: resolveI18nFeatures(features),
  };
}

/**
 * Inject the resolved stepper i18n bundle in an injection context.
 */
export function injectStepperI18n(): CngxStepperI18n {
  return inject(CNGX_STEPPER_I18N);
}
