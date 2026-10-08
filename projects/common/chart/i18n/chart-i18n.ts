import { inject, InjectionToken, type Provider, type Signal } from '@angular/core';
import { createLanguageSection, createSectionBundle, formatMessage } from '@cngx/core/i18n';
import { createOverrideMerge } from '@cngx/core/utils';

import { formatChartNumber } from '../chart/format-number';
import { CNGX_CHART_LANGUAGE_EN, type CngxChartLanguageSection } from './chart-language-section';

/**
 * Summary input describing the chart's current data shape. Consumed by
 * `CngxChartI18n.summary()` to produce the `aria-label` text the
 * `<cngx-chart>` host announces to screen readers.
 *
 * @category common/chart/i18n
 */
export interface CngxChartSummary {
  readonly trend: 'up' | 'down' | 'flat';
  readonly min: number;
  readonly max: number;
  readonly current: number;
  readonly thresholds: readonly number[];
}

/**
 * i18n surface for `@cngx/common/chart`. Mirrors the `CNGX_RECYCLER_I18N`
 * shape from `@cngx/common/data` - factory defaults supply English;
 * consumers override per-app via {@link provideChartI18n}.
 *
 * @category common/chart/i18n
 */
export interface CngxChartI18n {
  readonly summary: (input: CngxChartSummary) => string;
  readonly dataTable: () => string;
  /**
   * Header of the data table's index column. Optional so pre-existing full
   * overrides keep compiling; English `#`.
   */
  readonly indexColumnLabel?: () => string;
  readonly valueColumnLabel: () => string;
  readonly trendChanged: (trend: 'up' | 'down' | 'flat') => string;
  readonly thresholdAlert: (threshold: number) => string;
  readonly connectionLost: () => string;
  readonly connectionReconnecting: () => string;
  readonly connectionRestored: () => string;
  readonly empty: () => string;
  readonly loading: () => string;
  readonly error: () => string;
  /**
   * Accname for a `<cngx-stacked-bar>` with no segments. Optional so
   * pre-existing full overrides keep compiling; the token factory
   * supplies English and the component falls back to its built-in
   * phrasing when a custom override omits the key.
   */
  readonly stackedBarEmpty?: () => string;
  /**
   * Auto-generated accname for a `<cngx-stacked-bar>`: the total plus
   * one label/value pair per segment. Optional for the same
   * compatibility reason as {@link CngxChartI18n.stackedBarEmpty}.
   */
  readonly stackedBarSummary?: (
    total: number,
    segments: readonly { readonly label: string; readonly value: number }[],
  ) => string;
  /**
   * Tooltip of one stacked-bar segment. Receives the segment label and its
   * value, already formatted for the app locale. Optional for the same
   * compatibility reason as {@link CngxChartI18n.stackedBarEmpty}; English
   * `label: value`.
   */
  readonly stackedBarSegmentTitle?: (label: string, value: string) => string;
}

type ChartTrend = CngxChartSummary['trend'];

/** @internal The section word for each trend in the summary sentence. */
const SUMMARY_TREND_KEY = {
  up: 'summaryTrendUp',
  down: 'summaryTrendDown',
  flat: 'summaryTrendFlat',
} as const satisfies Record<ChartTrend, keyof CngxChartLanguageSection>;

/** @internal The section phrase announced when the trend changes. */
const TREND_CHANGED_KEY = {
  up: 'trendChangedUp',
  down: 'trendChangedDown',
  flat: 'trendFlattened',
} as const satisfies Record<ChartTrend, keyof CngxChartLanguageSection>;

/** @internal Turns a chart section into the token's keys for a locale. */
function chartBundleFrom(
  section: CngxChartLanguageSection,
  locale: string,
): Required<CngxChartI18n> {
  const num = (v: number): string => formatChartNumber(v, locale);
  const segmentTitle = (label: string, value: string): string =>
    formatMessage(section.stackedBarSegmentTitle, { label, value }, locale);
  return {
    summary: ({ trend, min, max, current, thresholds }) => {
      const trendText = section[SUMMARY_TREND_KEY[trend]];
      const thresholdText =
        thresholds.length === 0
          ? section.summaryNoThresholds
          : formatMessage(section.summaryThresholds, { count: thresholds.length }, locale);
      return formatMessage(
        section.summary,
        {
          trend: trendText,
          min: num(min),
          max: num(max),
          current: num(current),
          thresholds: thresholdText,
        },
        locale,
      );
    },
    dataTable: () => section.dataTable,
    indexColumnLabel: () => section.indexColumnLabel,
    valueColumnLabel: () => section.valueColumnLabel,
    trendChanged: (trend) => section[TREND_CHANGED_KEY[trend]],
    thresholdAlert: (threshold) =>
      formatMessage(section.thresholdAlert, { threshold: num(threshold) }, locale),
    connectionLost: () => section.connectionLost,
    connectionReconnecting: () => section.connectionReconnecting,
    connectionRestored: () => section.connectionRestored,
    empty: () => section.empty,
    loading: () => section.loading,
    error: () => section.error,
    stackedBarEmpty: () => section.stackedBarEmpty,
    stackedBarSummary: (total, segments) =>
      formatMessage(
        section.stackedBarSummary,
        {
          total: num(total),
          segments: segments
            .map((s) => segmentTitle(s.label, num(s.value)))
            .join(section.listSeparator),
        },
        locale,
      ),
    stackedBarSegmentTitle: segmentTitle,
  };
}

/**
 * The default chart copy for one section and one number locale - the single
 * source every fallback path resolves against. Numbers inside the copy
 * (summary min / max / current, threshold, stacked-bar values) format in
 * `locale`; the words come from `section`.
 *
 * @internal
 */
export const createChartI18nDefaults = chartBundleFrom;

/** @internal The English chart section with the active pack's chart section on top. */
const injectChartSection = createLanguageSection('chart', CNGX_CHART_LANGUAGE_EN);

/** @internal Builds and reads the token, formatted for the reading locale. */
const chartBundle = createSectionBundle<CngxChartLanguageSection, CngxChartI18n>({
  section: injectChartSection,
  toBundle: chartBundleFrom,
});

/**
 * Injection token for chart i18n strings, a `Signal` so the copy follows a
 * runtime language switch. Defaults to English via `factory:`, with numbers
 * in the root app locale (`CNGX_LOCALE`, falling back to `LOCALE_ID`), read
 * live. Override at app root with {@link provideChartI18n}; every key left
 * at its default still follows the app locale at the use site, including a
 * runtime `CNGX_LOCALE` flip.
 *
 * @category common/chart/i18n
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/i18n/chart-i18n.ts
 * @since 0.1.0
 */
export const CNGX_CHART_I18N = new InjectionToken<Signal<CngxChartI18n>>('CngxChartI18n', {
  providedIn: 'root',
  factory: () => chartBundle.build(),
});

/**
 * Branded feature-fn for {@link provideChartI18n}.
 *
 * @category common/chart/i18n
 */
export type CngxChartI18nFeature = ((bundle: Signal<CngxChartI18n>) => Signal<CngxChartI18n>) & {
  readonly _target: 'i18n';
};

/** @internal */
function defineChartI18nFeature(
  fn: (bundle: Signal<CngxChartI18n>) => Signal<CngxChartI18n>,
): CngxChartI18nFeature {
  return Object.assign(fn, { _target: 'i18n' as const });
}

/**
 * Override chart copy via a partial bundle - unset keys keep the language
 * pack's copy, or the English default, and keep following the app locale.
 * Pass a `Signal` to switch the language at runtime.
 *
 * @category common/chart/i18n
 */
export function withChartI18nLabels(
  overrides: Partial<CngxChartI18n> | Signal<Partial<CngxChartI18n>>,
): CngxChartI18nFeature {
  return defineChartI18nFeature((bundle) => createOverrideMerge(bundle, overrides));
}

/**
 * Provider for the chart i18n bundle. The features apply on top of the
 * active language pack, so a consumer localises only the keys they care
 * about; every key left out keeps the pack's copy and follows the app locale.
 *
 * ```typescript
 * providers: [
 *   provideChartI18n(
 *     withChartI18nLabels({
 *       dataTable: () => 'Datentabelle',
 *     }),
 *   ),
 * ]
 * ```
 *
 * @category common/chart/i18n
 */
export function provideChartI18n(...features: readonly CngxChartI18nFeature[]): Provider {
  return {
    provide: CNGX_CHART_I18N,
    useFactory: (): Signal<CngxChartI18n> => chartBundle.build(features),
  };
}

/**
 * @internal - the chart i18n bundle for the reading site. Every key the
 * token value leaves out, or leaves at its default, follows the use site's
 * pack section and locale; a key the consumer set stays theirs verbatim.
 * One signal per (token value, pack section, locale), shared by every chart
 * part under one injector.
 */
export function injectChartI18n(): Signal<Required<CngxChartI18n>> {
  // resolve() fills every key the value leaves out from the complete section bundle.
  return chartBundle.resolve(inject(CNGX_CHART_I18N)) as Signal<Required<CngxChartI18n>>;
}
