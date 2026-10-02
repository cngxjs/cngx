import { computed, inject, InjectionToken, type Provider, type Signal } from '@angular/core';
import { formatMessage, injectLanguageSection } from '@cngx/core/i18n';
import { createOverrideMerge, injectLocale, memoize } from '@cngx/core/utils';
import { recordEqual } from '@cngx/utils';

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

/**
 * Every formatter a {@link createChartI18nDefaults} call produced. A token
 * key holding one of these is still a library default, so the use-site
 * resolver swaps it for the current locale's default.
 *
 * @internal
 */
const DEFAULT_FORMATTERS = new WeakSet<object>();

const CHART_I18N_DEFAULTS_CACHE_LIMIT = 32;

const DEFAULTS_BY_SECTION = new WeakMap<
  CngxChartLanguageSection,
  (locale: string) => Required<CngxChartI18n>
>();

/**
 * The default formatters for one chart section and one number locale - the
 * single source every fallback path resolves against. Numbers inside the
 * copy (summary min / max / current, threshold, stacked-bar values) format
 * in `locale`; the words come from `section`. Memoized per section object
 * and locale, so every reader of one pair shares the same function
 * references.
 *
 * @internal
 */
export function createChartI18nDefaults(
  section: CngxChartLanguageSection,
  locale: string,
): Required<CngxChartI18n> {
  let byLocale = DEFAULTS_BY_SECTION.get(section);
  if (!byLocale) {
    byLocale = memoize(
      (forLocale: string) => {
        const defaults = chartBundleFrom(section, forLocale);
        for (const fn of Object.values(defaults)) {
          DEFAULT_FORMATTERS.add(fn);
        }
        return defaults;
      },
      { cacheLimit: CHART_I18N_DEFAULTS_CACHE_LIMIT },
    );
    DEFAULTS_BY_SECTION.set(section, byLocale);
  }
  return byLocale(locale);
}

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
      const trendText =
        trend === 'up'
          ? section.summaryTrendUp
          : trend === 'down'
            ? section.summaryTrendDown
            : section.summaryTrendFlat;
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
    trendChanged: (trend) =>
      trend === 'up'
        ? section.trendChangedUp
        : trend === 'down'
          ? section.trendChangedDown
          : section.trendFlattened,
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

const NO_SECTION: Partial<CngxChartLanguageSection> = {};

/** @internal The English chart section with the active pack's chart section on top. */
function injectChartLanguage(): Signal<CngxChartLanguageSection> {
  const pack = injectLanguageSection('chart');
  return createOverrideMerge(
    CNGX_CHART_LANGUAGE_EN,
    computed(() => pack() ?? NO_SECTION),
  );
}

/**
 * The en-US defaults. Module-internal (not on `public-api.ts`):
 * {@link provideChartI18n} merges over it, and {@link injectChartI18n}
 * recognises its keys as defaults, so the English never exists twice.
 *
 * @internal
 */
export const CHART_I18N_EN: Required<CngxChartI18n> = createChartI18nDefaults(
  CNGX_CHART_LANGUAGE_EN,
  'en-US',
);

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
  factory: (): Signal<CngxChartI18n> => {
    const section = injectChartLanguage();
    const locale = injectLocale();
    return computed(() => createChartI18nDefaults(section(), locale()), { equal: recordEqual });
  },
});

/**
 * Provider helper for custom chart i18n strings. Overrides merge over
 * the English defaults, so a consumer localises only the keys they
 * care about and every key added to {@link CngxChartI18n} later keeps
 * its default instead of forcing an update. Passing a full object
 * still works - it simply overrides every key. Pass a `Signal` to switch
 * the language at runtime.
 *
 * ```typescript
 * providers: [provideChartI18n({
 *   summary: ({ trend, min, max, current }) =>
 *     `${trend === 'up' ? 'Aufwärtstrend' : 'Abwärtstrend'}. Min ${min}, Max ${max}, aktuell ${current}.`,
 *   dataTable: () => 'Datentabelle',
 * })]
 * ```
 *
 * @category common/chart/i18n
 */
export function provideChartI18n(
  i18n: Partial<CngxChartI18n> | Signal<Partial<CngxChartI18n>>,
): Provider {
  return {
    provide: CNGX_CHART_I18N,
    useFactory: (): Signal<CngxChartI18n> => createOverrideMerge<CngxChartI18n>(CHART_I18N_EN, i18n),
  };
}

/** @internal */
type ChartI18nKey = keyof CngxChartI18n;

/** @internal */
const resolvedByToken = new WeakMap<
  Signal<CngxChartI18n>,
  WeakMap<Signal<string>, Signal<Required<CngxChartI18n>>>
>();

/**
 * @internal - the chart i18n bundle as a locale-aware signal. Every key
 * that is absent from the token value, or still a library default (the
 * en-US bundle, the token factory's root-locale snapshot, or a
 * {@link provideChartI18n} merge that kept it), resolves to the current
 * `CNGX_LOCALE` default; a key the consumer passed stays theirs verbatim.
 * One `computed()` per (token value, locale signal) pair, so every chart
 * part under one injector shares it.
 */
export function injectChartI18n(): Signal<Required<CngxChartI18n>> {
  const bundle = inject(CNGX_CHART_I18N);
  const section = injectChartLanguage();
  const locale = injectLocale();
  let byLocale = resolvedByToken.get(bundle);
  if (!byLocale) {
    byLocale = new WeakMap();
    resolvedByToken.set(bundle, byLocale);
  }
  let resolved = byLocale.get(locale);
  if (!resolved) {
    resolved = computed(
      () => {
        const own = bundle();
        const localized = createChartI18nDefaults(section(), locale());
        const out: Record<string, unknown> = { ...localized };
        for (const key of Object.keys(localized) as ChartI18nKey[]) {
          const value = own[key];
          if (value !== undefined && !DEFAULT_FORMATTERS.has(value)) {
            out[key] = value;
          }
        }
        return out as Required<CngxChartI18n>;
      },
      { equal: recordEqual },
    );
    byLocale.set(locale, resolved);
  }
  return resolved;
}
