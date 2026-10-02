import type { CngxMessage } from '@cngx/core/i18n';

/**
 * The kpi section of a {@link CngxLanguagePack}: the copy of the KPI atoms
 * `CngxMetric`, `CngxDelta`, `CngxTrend` and `CngxGoal`. Magnitudes reach the
 * messages already formatted for the app locale.
 *
 * @category common/data/i18n
 * @since 0.1.0
 * @relatedTo CNGX_KPI_I18N
 */
export interface CngxKpiLanguageSection {
  /** `{value}`, `{sentiment}`: the accessible name of a delta. */
  readonly deltaLabel: CngxMessage;
  readonly deltaImproved: string;
  readonly deltaDeclined: string;
  readonly deltaUnchanged: string;
  /** `{value}`, `{direction}`: the accessible name of a trend. */
  readonly trendLabel: CngxMessage;
  readonly trendUp: string;
  readonly trendDown: string;
  readonly trendFlat: string;
  /** `{now}`, `{max}`: a goal's `aria-valuetext`. */
  readonly goalValueText: CngxMessage;
  /** `{value}`, `{unit}`: a metric's value and unit, in reading order. */
  readonly metricValueWithUnit: string;
  /** Shown in place of a metric without a value. */
  readonly metricPlaceholder: string;
  /** Accessible name of a metric without a value. */
  readonly metricNoValue: string;
}

/**
 * The English kpi section: the single source of the KPI atoms' English copy.
 * `CNGX_KPI_I18N` defaults to it.
 *
 * @category common/data/i18n
 * @since 0.1.0
 * @relatedTo CNGX_KPI_I18N
 */
export const CNGX_KPI_LANGUAGE_EN: CngxKpiLanguageSection = {
  deltaLabel: '{value} {sentiment}',
  deltaImproved: 'improved',
  deltaDeclined: 'declined',
  deltaUnchanged: 'unchanged',
  trendLabel: '{value} {direction}',
  trendUp: 'up',
  trendDown: 'down',
  trendFlat: 'unchanged',
  goalValueText: '{now} of {max}',
  metricValueWithUnit: '{value} {unit}',
  metricPlaceholder: '\u2014',
  metricNoValue: 'No value',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly kpi: CngxKpiLanguageSection;
  }
}
