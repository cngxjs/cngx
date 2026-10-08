import { inject, InjectionToken, type Provider, type Signal } from '@angular/core';
import { createLanguageSection, createSectionBundle, formatMessage } from '@cngx/core/i18n';
import { createOverrideMerge, numberFormatterFor } from '@cngx/core/utils';

import { CNGX_KPI_LANGUAGE_EN, type CngxKpiLanguageSection } from '../../i18n/kpi-language-section';
import type { DeltaDirection, DeltaSentiment } from './delta-format';

/**
 * KPI atom i18n surface. Library defaults are English; consumers override
 * via {@link provideKpiI18n}. Reactive from birth: the token carries a
 * `Signal`, and {@link withKpiI18nLabels} accepts a `Signal` of a partial
 * bundle, so a runtime language switch re-derives every label.
 *
 * Every key is a formatter, so word order and plural rules belong to the
 * translator. The magnitude arrives already formatted in the app locale
 * (`CNGX_LOCALE`); the per-instance `label` / `valueTextFormat` inputs still
 * win over the bundle.
 *
 * @category common/data/i18n
 * @since 0.1.0
 */
export interface CngxKpiI18n {
  /** `CngxDelta` accessible name: formatted magnitude plus the sentiment word. */
  readonly deltaLabel: (formatted: string, sentiment: DeltaSentiment) => string;
  /** `CngxTrend` accessible name: formatted magnitude plus the direction word. */
  readonly trendLabel: (formatted: string, direction: DeltaDirection) => string;
  /** `CngxGoal` `aria-valuetext`: clamped value and target. */
  readonly goalValueText: (now: number, max: number) => string;
  /**
   * `CngxMetric` order of value and unit: `{value}` and `{unit}` in reading
   * order, a plain template the metric renders as two elements. English
   * `'{value} {unit}'`.
   */
  readonly metricValueWithUnit: string;
  /** Shown in place of a `CngxMetric` without a value. English: the U+2014 glyph. */
  readonly metricPlaceholder: string;
  /** Accessible name of a `CngxMetric` without a value. English `No value`. */
  readonly metricNoValue: string;
}

const GOAL_NUMBER: Intl.NumberFormatOptions = {};

/** @internal Turns a kpi section into the token's keys for a locale. */
function kpiBundleFrom(section: CngxKpiLanguageSection, locale: string): CngxKpiI18n {
  const sentiment: Record<DeltaSentiment, string> = {
    positive: section.deltaImproved,
    negative: section.deltaDeclined,
    neutral: section.deltaUnchanged,
  };
  const direction: Record<DeltaDirection, string> = {
    up: section.trendUp,
    down: section.trendDown,
    flat: section.trendFlat,
  };
  const goalNumber = numberFormatterFor(locale, GOAL_NUMBER);
  return {
    deltaLabel: (value, s) =>
      formatMessage(section.deltaLabel, { value, sentiment: sentiment[s] }, locale),
    trendLabel: (value, d) =>
      formatMessage(section.trendLabel, { value, direction: direction[d] }, locale),
    goalValueText: (now, max) =>
      formatMessage(
        section.goalValueText,
        { now: goalNumber.format(now), max: goalNumber.format(max) },
        locale,
      ),
    metricValueWithUnit: section.metricValueWithUnit,
    metricPlaceholder: section.metricPlaceholder,
    metricNoValue: section.metricNoValue,
  };
}

/** @internal The kpi section of the active pack over English. */
const injectKpiSection = createLanguageSection('kpi', CNGX_KPI_LANGUAGE_EN);

/** @internal Builds and reads the token, formatted for the reading locale. */
const kpiBundle = createSectionBundle<CngxKpiLanguageSection, CngxKpiI18n>({
  section: injectKpiSection,
  toBundle: kpiBundleFrom,
});

/**
 * DI token for the KPI i18n bundle. `providedIn: 'root'`: the kpi section
 * of the active language pack over the English defaults, formatted for the
 * app locale; the value is a `Signal`, shared by every reader under one
 * injector.
 *
 * @category common/data/i18n
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/data/display/shared/kpi-i18n.ts
 * @since 0.1.0
 * @relatedTo CngxDelta, CngxTrend, CngxGoal
 */
export const CNGX_KPI_I18N = new InjectionToken<Signal<CngxKpiI18n>>('CngxKpiI18n', {
  providedIn: 'root',
  factory: () => kpiBundle.build(),
});

/**
 * Branded feature-fn for {@link provideKpiI18n}.
 *
 * @category common/data/i18n
 * @since 0.1.0
 */
export type CngxKpiI18nFeature = ((bundle: Signal<CngxKpiI18n>) => Signal<CngxKpiI18n>) & {
  readonly _target: 'i18n';
};

/** @internal */
function defineKpiI18nFeature(
  fn: (bundle: Signal<CngxKpiI18n>) => Signal<CngxKpiI18n>,
): CngxKpiI18nFeature {
  return Object.assign(fn, { _target: 'i18n' as const });
}

/**
 * Override KPI labels via a partial bundle - unset keys keep the language
 * pack's copy, or the English default. Pass a `Signal` of a partial bundle to switch languages at
 * runtime.
 *
 * @category common/data/i18n
 * @since 0.1.0
 */
export function withKpiI18nLabels(
  overrides: Partial<CngxKpiI18n> | Signal<Partial<CngxKpiI18n>>,
): CngxKpiI18nFeature {
  return defineKpiI18nFeature((bundle) => createOverrideMerge(bundle, overrides));
}

/**
 * Provider for the KPI i18n bundle. Returns a plain `Provider`, so it also
 * scopes a subtree through `viewProviders`. The features apply on top of the
 * active language pack.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideKpiI18n(
 *       withKpiI18nLabels({
 *         goalValueText: (now, max) => `${now} von ${max}`,
 *       }),
 *     ),
 *   ],
 * });
 * ```
 *
 * @category common/data/i18n
 * @since 0.1.0
 */
export function provideKpiI18n(...features: readonly CngxKpiI18nFeature[]): Provider {
  return {
    provide: CNGX_KPI_I18N,
    useFactory: () => kpiBundle.build(features),
  };
}

/**
 * Inject the resolved KPI i18n bundle signal. Read it inside a `computed()`
 * or template so a runtime override flip re-derives.
 *
 * @category common/data/i18n
 * @since 0.1.0
 */
export function injectKpiI18n(): Signal<CngxKpiI18n> {
  return kpiBundle.resolve(inject(CNGX_KPI_I18N));
}
