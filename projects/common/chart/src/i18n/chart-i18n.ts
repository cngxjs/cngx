import { InjectionToken } from '@angular/core';

/**
 * Summary input describing the chart's current data shape. Consumed by
 * `CngxChartI18n.summary()` to produce the `aria-label` text the
 * `<cngx-chart>` host announces to screen readers.
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
 * shape from `@cngx/common/data` — factory defaults supply English;
 * consumers override per-app via {@link provideChartI18n}.
 */
export interface CngxChartI18n {
  readonly summary: (input: CngxChartSummary) => string;
  readonly dataTable: () => string;
  readonly valueColumnLabel: () => string;
  readonly trendChanged: (trend: 'up' | 'down' | 'flat') => string;
  readonly thresholdAlert: (threshold: number) => string;
  readonly empty: () => string;
  readonly loading: () => string;
  readonly error: () => string;
}

/**
 * Injection token for chart i18n strings. Defaults to English via
 * `factory:`. Override at app root with {@link provideChartI18n}.
 */
export const CNGX_CHART_I18N = new InjectionToken<CngxChartI18n>('CngxChartI18n', {
  providedIn: 'root',
  factory: (): CngxChartI18n => ({
    summary: ({ trend, min, max, current, thresholds }) => {
      const trendText = trend === 'up' ? 'Trending up' : trend === 'down' ? 'Trending down' : 'Flat';
      const thresholdText = thresholds.length === 0
        ? 'No thresholds.'
        : thresholds.length === 1
          ? 'One threshold crossing.'
          : `${thresholds.length} threshold crossings.`;
      return `${trendText}. Min ${min}, max ${max}, current ${current}. ${thresholdText}`;
    },
    dataTable: () => 'Data table',
    valueColumnLabel: () => 'Value',
    trendChanged: (trend) =>
      trend === 'up' ? 'Trend changed to up' : trend === 'down' ? 'Trend changed to down' : 'Trend flattened',
    thresholdAlert: (threshold) => `Threshold ${threshold} crossed`,
    empty: () => 'No data',
    loading: () => 'Loading',
    error: () => 'Error loading chart',
  }),
});

/**
 * Provider helper for custom chart i18n strings.
 *
 * ```typescript
 * providers: [provideChartI18n({
 *   summary: ({ trend, min, max, current, thresholds }) =>
 *     `${trend === 'up' ? 'Aufwärtstrend' : 'Abwärtstrend'}. Min ${min}, Max ${max}, aktuell ${current}.`,
 *   dataTable: () => 'Datentabelle',
 *   // ...remaining keys
 * })]
 * ```
 */
export function provideChartI18n(i18n: CngxChartI18n): {
  provide: typeof CNGX_CHART_I18N;
  useValue: CngxChartI18n;
} {
  return { provide: CNGX_CHART_I18N, useValue: i18n };
}
