import { inject, InjectionToken, type Provider } from '@angular/core';

/**
 * Stepper i18n surface. Library defaults are English (per
 * `feedback_en_default_locale`); German / other locales come from
 * consumer overrides via {@link provideStepperI18n}.
 *
 * Mirrors `CNGX_TABS_I18N` and `CNGX_CHART_I18N` — the same
 * provider+token+inject helper triple every cngx feature ships.
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
  /**
   * @deprecated for stepper commit rollback — superseded by
   * {@link commitRolledBackTo}. Retained as the **defensive fallback**
   * in the organism's `liveAnnouncement` priority chain when the
   * origin label is unresolvable. Reachability mirrors the tabs
   * family: under the current `select()` flow the
   * `originIndexDuringCommit` slot is always written before the
   * commit window opens, so the fallback path fires only when the
   * origin label resolves to falsy (unlabeled step) OR a future
   * producer feeds `commitState` outside `select()` (programmatic
   * state mutation on the host contract).
   */
  readonly commitFailedRetry: string;
  /**
   * Polite SR announcement while a commit is in flight. Read by the
   * organism's `liveAnnouncement` computed on the `idle → pending`
   * arm. Pillar 2: every state change reaches AT.
   */
  readonly commitInFlight: string;
  /**
   * Origin-aware rollback announcement. Receives the label of the
   * step the user was returned to (the "safe-harbour" step) and
   * yields a phrase like `Reverted to step "Customer".`. Read by the
   * organism's `liveAnnouncement` computed on the `pending → error`
   * transition when both `lastFailedIndex` and
   * `originIndexDuringCommit` are set.
   */
  readonly commitRolledBackTo: (originLabel: string) => string;
  /**
   * Persistent suffix appended to the per-step `aria-describedby`
   * descriptor when the step's flat-index matches
   * `presenter.lastFailedIndex()`. Distinct from
   * {@link commitRolledBackTo} (the polite live-region phrase that
   * announces the *transition* once and fades) — this suffix lives
   * in the per-step descriptor so AT users navigating BACK to the
   * rejected step after the announcement subsides still hear the
   * rollback context. Pillar 2: every state change communicates,
   * even after the moment of change has passed.
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
 * with the English defaults.
 *
 * @category interactive
 */
export const CNGX_STEPPER_I18N = new InjectionToken<CngxStepperI18n>(
  'CngxStepperI18n',
  { providedIn: 'root', factory: () => STEPPER_I18N_DEFAULTS },
);

/**
 * Single feature-flag function consumed by {@link provideStepperI18n} and the
 * family aggregator {@link provideCngxStepper}. Carries a hidden `_target`
 * discriminator so the aggregator can dispatch i18n features to
 * {@link provideStepperI18n} while config features go to
 * {@link provideStepperConfig}. Mirrors `CngxTabsI18nFeature` from the tabs
 * family.
 *
 * @category interactive
 */
export type CngxStepperI18nFeature = ((
  bundle: CngxStepperI18n,
) => CngxStepperI18n) & {
  readonly _target: 'i18n';
};

/**
 * Internal helper that brands an i18n-mutator function with the `_target`
 * discriminator. Every `with*` i18n feature returns one of these.
 *
 * @internal
 */
function defineStepperI18nFeature(
  fn: (bundle: CngxStepperI18n) => CngxStepperI18n,
): CngxStepperI18nFeature {
  return Object.assign(fn, { _target: 'i18n' as const });
}

/**
 * Override one or more i18n labels on the stepper surface. Pass a partial
 * override — unset keys keep their English default. Mirrors the
 * `withStepperAriaLabels` / `withStepperFallbackLabels` shape on the
 * config surface so `provideCngxStepper` can compose features uniformly
 * across both `CNGX_STEPPER_CONFIG` and `CNGX_STEPPER_I18N`.
 *
 * @category interactive
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
 * features (and any future i18n `with*` features) — unset keys fall
 * back to the English default.
 *
 * @example
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideStepperI18n(
 *       withStepperI18nLabels({ stepperLabel: 'Schrittfolge', previousStep: 'Vorheriger' }),
 *     ),
 *   ],
 * });
 * ```
 *
 * @category interactive
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
 *
 * @category interactive
 */
export function injectStepperI18n(): CngxStepperI18n {
  return inject(CNGX_STEPPER_I18N);
}
