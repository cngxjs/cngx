import { inject, InjectionToken, type Provider, type Signal } from '@angular/core';
import { createNestedLanguageSection, createSectionBundle, formatMessage } from '@cngx/core/i18n';
import { createNestedOverrideMerge } from '@cngx/core/utils';

import {
  CNGX_STEPPER_LANGUAGE_EN,
  type CngxStepperLanguageSection,
  type CngxStepperStatusLanguage,
} from './stepper-language-section';

/**
 * Status-pill labels used by the `stripe-status-rich` skin (and any
 * future skin / variant that surfaces a per-step status pill). Sub-
 * bundle of {@link CngxStepperI18n}; consumers override partial keys
 * via {@link withStepperI18nLabels} - un-overridden keys keep their
 * English defaults. The same shape as the section's status words, declared
 * once as {@link CngxStepperStatusLanguage}.
 *
 * @category common/stepper/i18n
 */
export type CngxStepperStatusLabels = CngxStepperStatusLanguage;

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
   * `CNGX_STEPPER_CONFIG.ariaLabels.stepperRegion` (default `'Steps'`) is
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
  /** `aria-roledescription` of a step group header. English `step group`. */
  readonly groupRoleDescription: string;
  readonly selectedStep: (label: string, position: number, count: number) => string;
  /**
   * A step name followed by a detail - its status (`Step 2 of 3: Shipping:
   * Errored`) or its label (`Step 2 of 3: Shipping`). One message, so a
   * locale owns the joiner and the order.
   */
  readonly stepWithDetail: (step: string, detail: string) => string;
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
   * Per-step `aria-describedby` text while `presenter.lastFailedIndex()`
   * matches the step. Receives the step's base description (e.g.
   * `Step 2 of 3: Shipping`) and owns the whole sentence, so a locale can
   * place the rolled-back note before, after or inside it. Distinct from
   * {@link commitRolledBackTo} (transient live-region phrase) - this text
   * is reachable when AT users navigate back to the rejected step after
   * the announcement has faded. Pillar 2.
   */
  readonly stepRolledBack: (base: string) => string;
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
  /** Visible collapsed-group badge for `groupCollapseSummary: 'count'`. */
  readonly groupSummaryCountShort: (total: number) => string;
  /** Visible collapsed-group badge for `groupCollapseSummary: 'progress'`. */
  readonly groupSummaryProgressShort: (completed: number, total: number) => string;
  /**
   * Last-resort label of a Material `<mat-step>` instrumented by
   * `[cngxMatStepper]` when it has no `label`, `ariaLabel` or static
   * `matStepLabel` text. Receives the cngx handle id. English default
   * `Step <id>`.
   */
  readonly stepFallbackLabel: (id: string) => string;
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

/** @internal Turns a stepper section into the token's keys for a locale. */
function stepperBundleFrom(section: CngxStepperLanguageSection, locale: string): CngxStepperI18n {
  return {
    stepperLabel: section.stepperLabel,
    stepIndicatorRoleDescription: section.stepIndicatorRoleDescription,
    groupRoleDescription: section.groupRoleDescription,
    selectedStep: (label, position, count) =>
      formatMessage(section.selectedStep, { label, position, count }, locale),
    stepWithDetail: (step, detail) =>
      formatMessage(section.stepWithDetail, { step, detail }, locale),
    stepHasErrors: (count) => formatMessage(section.stepHasErrors, { count }, locale),
    previousStep: section.previousStep,
    nextStep: section.nextStep,
    commitFailedRetry: section.commitFailedRetry,
    commitInFlight: section.commitInFlight,
    commitRolledBackTo: (origin) => formatMessage(section.commitRolledBackTo, { origin }, locale),
    stepRolledBack: (base) => formatMessage(section.stepRolledBack, { base }, locale),
    statusLabels: section.statusLabels,
    textStepperFormat: (current, count) =>
      formatMessage(section.textStepperFormat, { current, count }, locale),
    groupSummaryCount: (count) => formatMessage(section.groupSummaryCount, { count }, locale),
    groupSummaryProgress: (completed, count) =>
      formatMessage(section.groupSummaryProgress, { completed, count }, locale),
    groupSummaryCountShort: (count) =>
      formatMessage(section.groupSummaryCountShort, { count }, locale),
    groupSummaryProgressShort: (completed, count) =>
      formatMessage(section.groupSummaryProgressShort, { completed, count }, locale),
    stepFallbackLabel: (id) => formatMessage(section.stepFallbackLabel, { id }, locale),
  };
}

/**
 * @internal The English stepper section with the active pack's stepper
 * section on top. Feeds both `CNGX_STEPPER_I18N` and the
 * `CNGX_STEPPER_CONFIG` labels.
 */
export const injectStepperLanguage = createNestedLanguageSection(
  'stepper',
  CNGX_STEPPER_LANGUAGE_EN,
  'statusLabels',
);

/** @internal Builds and reads the token, formatted for the reading locale. */
const stepperBundle = createSectionBundle<CngxStepperLanguageSection, CngxStepperI18n>({
  section: injectStepperLanguage,
  toBundle: stepperBundleFrom,
});

/**
 * DI token for the resolved stepper i18n bundle, as a `Signal` so a
 * runtime language switch re-renders every label it feeds.
 * `providedIn: 'root'`: the stepper section of the active language pack over
 * the English defaults, formatted for the app locale. Provide it through
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
  factory: () => stepperBundle.build(),
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
 * the language pack's copy, or the English default. {@link CngxStepperStatusLabels} is merged
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
 * (plus any future i18n `with*`) - unset keys fall back to the language
 * pack, then English. The features apply on top of the active pack.
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
    useFactory: () => stepperBundle.build(features),
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
  return stepperBundle.resolve(inject(CNGX_STEPPER_I18N));
}
