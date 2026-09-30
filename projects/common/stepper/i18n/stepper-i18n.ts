import { inject, InjectionToken, type Provider, type Signal } from '@angular/core';
import { coerceSignal, createNestedOverrideMerge } from '@cngx/core/utils';

/**
 * Status-pill labels used by the `stripe-status-rich` skin (and any
 * future skin / variant that surfaces a per-step status pill). Sub-
 * bundle of {@link CngxStepperI18n}; consumers override partial keys
 * via {@link withStepperI18nLabels} - un-overridden keys keep their
 * English defaults.
 *
 * @category common/stepper/i18n
 */
export interface CngxStepperStatusLabels {
  readonly done: string;
  readonly inProgress: string;
  readonly upNext: string;
  readonly errored: string;
}

/**
 * Stepper i18n surface. Library defaults are English; locales come from
 * consumer overrides via {@link provideStepperI18n}. Sibling of
 * `CNGX_TABS_I18N` / `CNGX_CHART_I18N`.
 *
 * @category common/stepper/i18n
 */
export interface CngxStepperI18n {
  /**
   * Last tier of the landmark `aria-label` and of the organism's
   * `aria-roledescription`. The label applies only while
   * `CNGX_STEPPER_CONFIG.ariaLabels.stepperRegion` (default `'Stepper'`) is
   * unset, the role description only while `fallbackLabels.stepRoleDescription`
   * (default `'stepper'`) is unset. Localise both through
   * `withStepperAriaLabels(...)` and `withStepperFallbackLabels(...)`.
   */
  readonly stepperLabel: string;
  /**
   * Landmark `aria-roledescription` for compact step-indicator
   * surfaces such as the dot stepper and the mobile-dot collapse
   * fallback. Mirrors the W3C APG step-indicator pattern.
   *
   * @category common/stepper/i18n
   */
  readonly stepIndicatorRoleDescription: string;
  readonly selectedStep: (label: string, position: number, count: number) => string;
  /** @deprecated Superseded by `statusLabels.done` - the announcement surface converged on the pill labels. Kept one release. */
  readonly stepCompleted: string;
  /** @deprecated Superseded by `statusLabels.errored`. Kept one release. */
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
   * {@link commitRolledBackTo} (transient live-region phrase) - this
   * suffix is reachable when AT users navigate back to the rejected
   * step after the announcement has faded. Pillar 2.
   */
  readonly stepRolledBackSuffix: string;
  /**
   * Per-state pill labels surfaced by the `stripe-status-rich` skin
   * (and any future skin / variant that paints a state pill). English
   * defaults; consumer partial overrides via
   * {@link withStepperI18nLabels} keep un-overridden keys intact.
   */
  readonly statusLabels: CngxStepperStatusLabels;
  /**
   * Short progress format used by `CngxProgressBarStepper`'s optional
   * step-count subtext and by `CngxTextStepper`. Receives the
   * 1-based current position and total step count; default
   * `(current, total) => 'Step ${current} of ${total}'`.
   *
   * @category common/stepper/i18n
   */
  readonly textStepperFormat: (current: number, total: number) => string;
  /** Collapsed-group SR phrase for `groupCollapseSummary: 'count'`. */
  readonly groupSummaryCount: (total: number) => string;
  /** Collapsed-group SR phrase for `groupCollapseSummary: 'progress'`. */
  readonly groupSummaryProgress: (completed: number, total: number) => string;
  /**
   * Last-resort label of a Material `<mat-step>` instrumented by
   * `[cngxMatStepper]` when it has no `label`, `ariaLabel` or static
   * `matStepLabel` text. Receives the cngx handle id. Optional so a bundle
   * built before it existed keeps compiling; the English default
   * (`Step <id>`) fills it.
   */
  readonly stepFallbackLabel?: (id: string) => string;
}

/**
 * Partial-override shape for {@link withStepperI18nLabels}. Behaves as
 * `Partial<CngxStepperI18n>` for top-level keys, plus a nested partial
 * for {@link CngxStepperStatusLabels} so consumers can override one
 * pill label without restating the full status-label bundle.
 *
 * @category common/stepper/i18n
 */
export type CngxStepperI18nOverrides = Omit<Partial<CngxStepperI18n>, 'statusLabels'> & {
  readonly statusLabels?: Partial<CngxStepperStatusLabels>;
};

/** @internal */
const DEFAULT_STEP_FALLBACK_LABEL = (id: string): string => `Step ${id}`;

/** @internal */
const STEPPER_I18N_DEFAULTS: CngxStepperI18n = {
  stepperLabel: 'Stepper',
  stepIndicatorRoleDescription: 'Step indicator',
  selectedStep: (label, position, count) => `Step ${position} of ${count}: ${label}`,
  stepCompleted: 'Completed',
  stepErrored: 'Has errors',
  stepHasErrors: (count) => `${count} error${count === 1 ? '' : 's'}`,
  previousStep: 'Previous step',
  nextStep: 'Next step',
  commitFailedRetry: 'Commit failed - retry?',
  commitInFlight: 'Committing step…',
  commitRolledBackTo: (originLabel) => `Reverted to step "${originLabel}".`,
  stepRolledBackSuffix: 'This step was rolled back.',
  statusLabels: {
    done: 'Done',
    inProgress: 'In progress',
    upNext: 'Up next',
    errored: 'Errored',
  },
  textStepperFormat: (current, total) => `Step ${current} of ${total}`,
  groupSummaryCount: (total) => `${total} steps`,
  groupSummaryProgress: (completed, total) => `${completed} of ${total} steps complete`,
  stepFallbackLabel: DEFAULT_STEP_FALLBACK_LABEL,
};

/**
 * @internal - the `<mat-step>` fallback label from a stepper bundle, or the
 * English default when the bundle omits the optional key (a directly
 * provided value that predates it).
 */
export function resolveStepFallbackLabel(i18n: CngxStepperI18n | undefined, id: string): string {
  return (i18n?.stepFallbackLabel ?? DEFAULT_STEP_FALLBACK_LABEL)(id);
}

/**
 * DI token for the resolved stepper i18n bundle, as a `Signal` so a
 * runtime language switch re-renders every label it feeds.
 * `providedIn: 'root'` with English defaults. Provide it through
 * {@link provideStepperI18n}; a `{ provide, useValue }` entry must supply a
 * `Signal<CngxStepperI18n>`.
 *
 * @category common/stepper/i18n
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/stepper/i18n/stepper-i18n.ts
 * @since 0.1.0
 */
export const CNGX_STEPPER_I18N = new InjectionToken<Signal<CngxStepperI18n>>('CngxStepperI18n', {
  providedIn: 'root',
  factory: () => coerceSignal(STEPPER_I18N_DEFAULTS),
});

/**
 * Feature shape consumed by {@link provideStepperI18n} and {@link provideCngxStepper}.
 * Hidden `_target: 'i18n'` discriminator routes through the family aggregator.
 * Sibling of `CngxTabsI18nFeature`.
 *
 * @category common/stepper/i18n
 */
export type CngxStepperI18nFeature = ((
  bundle: Signal<CngxStepperI18n>,
) => Signal<CngxStepperI18n>) & {
  readonly _target: 'i18n';
};

/**
 * Brands an i18n mutator with `_target: 'i18n'`. Every `with*` i18n
 * feature returns one of these.
 *
 * @internal
 */
function defineStepperI18nFeature(
  fn: (bundle: Signal<CngxStepperI18n>) => Signal<CngxStepperI18n>,
): CngxStepperI18nFeature {
  return Object.assign(fn, { _target: 'i18n' as const });
}

/**
 * Override stepper i18n labels. Partial override - unset keys keep
 * the English default. {@link CngxStepperStatusLabels} is merged
 * key-by-key so consumers can override one pill label without
 * restating the rest. Pass a `Signal` to switch the language at runtime.
 * Sibling of `withStepperAriaLabels` / `withStepperFallbackLabels`.
 *
 * @category common/stepper/i18n
 */
export function withStepperI18nLabels(
  overrides: CngxStepperI18nOverrides | Signal<CngxStepperI18nOverrides>,
): CngxStepperI18nFeature {
  return defineStepperI18nFeature((bundle) =>
    createNestedOverrideMerge(bundle, overrides, 'statusLabels'),
  );
}

/**
 * Provider for the stepper i18n bundle. Compose `withStepperI18nLabels(...)`
 * (plus any future i18n `with*`) - unset keys fall back to English.
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
 *
 * @category common/stepper/i18n
 */
export function provideStepperI18n(...features: readonly CngxStepperI18nFeature[]): Provider {
  return {
    provide: CNGX_STEPPER_I18N,
    useFactory: () =>
      features.reduce<Signal<CngxStepperI18n>>(
        (bundle, feat) => feat(bundle),
        coerceSignal(STEPPER_I18N_DEFAULTS),
      ),
  };
}

/**
 * Inject the resolved stepper i18n bundle in an injection context. Read it
 * inside a `computed()`, template or handler so a language switch reaches
 * the label.
 *
 * @category common/stepper/i18n
 */
export function injectStepperI18n(): Signal<CngxStepperI18n> {
  return inject(CNGX_STEPPER_I18N);
}
