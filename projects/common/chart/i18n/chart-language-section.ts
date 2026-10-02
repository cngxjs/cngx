import type { CngxMessage } from '@cngx/core/i18n';

/**
 * The chart section of a {@link CngxLanguagePack}: the copy of
 * `@cngx/common/chart`. Numbers reach the messages already formatted for
 * the app locale. `summary` and `stackedBarSummary` are assembled from
 * several keys, so a pack owns their words, their order and their list
 * separator.
 *
 * @category common/chart/i18n
 * @since 0.1.0
 * @relatedTo CNGX_CHART_I18N
 */
export interface CngxChartLanguageSection {
  /** `{trend}`, `{min}`, `{max}`, `{current}`, `{thresholds}`: the chart's accessible name. */
  readonly summary: CngxMessage;
  readonly summaryTrendUp: string;
  readonly summaryTrendDown: string;
  readonly summaryTrendFlat: string;
  /** The `{thresholds}` part of `summary` when no threshold is crossed. */
  readonly summaryNoThresholds: string;
  /** Plural on `{count}`: the `{thresholds}` part of `summary`. */
  readonly summaryThresholds: CngxMessage;
  /** Caption of the screen-reader data table. */
  readonly dataTable: string;
  /** Header of the data table's index column. */
  readonly indexColumnLabel: string;
  /** Header of the data table's value column. */
  readonly valueColumnLabel: string;
  readonly trendChangedUp: string;
  readonly trendChangedDown: string;
  readonly trendFlattened: string;
  /** `{threshold}`: announced when a threshold is crossed. */
  readonly thresholdAlert: CngxMessage;
  readonly connectionLost: string;
  readonly connectionReconnecting: string;
  readonly connectionRestored: string;
  readonly empty: string;
  readonly loading: string;
  readonly error: string;
  /** Accessible name of a stacked bar with no segments. */
  readonly stackedBarEmpty: string;
  /** `{total}`, `{segments}`: accessible name of a stacked bar. */
  readonly stackedBarSummary: CngxMessage;
  /** `{label}`, `{value}`: one stacked-bar segment, in its tooltip and in the summary. */
  readonly stackedBarSegmentTitle: CngxMessage;
  /** Joins the segments of `stackedBarSummary`. */
  readonly listSeparator: string;
}

/**
 * The English chart section: the single source of the chart's English copy.
 * `CNGX_CHART_I18N` defaults to it.
 *
 * @category common/chart/i18n
 * @since 0.1.0
 * @relatedTo CNGX_CHART_I18N
 */
export const CNGX_CHART_LANGUAGE_EN: CngxChartLanguageSection = {
  summary: '{trend}. Min {min}, max {max}, current {current}. {thresholds}',
  summaryTrendUp: 'Trending up',
  summaryTrendDown: 'Trending down',
  summaryTrendFlat: 'Flat',
  summaryNoThresholds: 'No thresholds.',
  summaryThresholds: { one: 'One threshold crossing.', other: '{count} threshold crossings.' },
  dataTable: 'Data table',
  indexColumnLabel: '#',
  valueColumnLabel: 'Value',
  trendChangedUp: 'Trend changed to up',
  trendChangedDown: 'Trend changed to down',
  trendFlattened: 'Trend flattened',
  thresholdAlert: 'Threshold {threshold} crossed',
  connectionLost: 'Connection lost',
  connectionReconnecting: 'Reconnecting',
  connectionRestored: 'Connection restored',
  empty: 'No data',
  loading: 'Loading',
  error: 'Error loading chart',
  stackedBarEmpty: 'Empty stacked bar',
  stackedBarSummary: 'Total {total}. {segments}.',
  stackedBarSegmentTitle: '{label}: {value}',
  listSeparator: ', ',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly chart: CngxChartLanguageSection;
  }
}
