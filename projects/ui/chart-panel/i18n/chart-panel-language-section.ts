/**
 * The chart-panel section of a {@link CngxLanguagePack}: the copy of
 * `CngxChartPanel`. It feeds the `ariaLabels` of `CNGX_CHART_PANEL_CONFIG`; a
 * key set through `withChartPanelAriaLabels` still wins.
 *
 * @category ui/chart-panel/i18n
 * @since 0.1.0
 * @relatedTo CNGX_CHART_PANEL_CONFIG, withChartPanelAriaLabels
 */
export interface CngxChartPanelLanguageSection {
  /** Accessible name announced while a panel-level operation runs. */
  readonly busy: string;
}

/**
 * The English chart-panel section: the single source of the chart panel's
 * English copy. The `CNGX_CHART_PANEL_CONFIG` labels default to it.
 *
 * @category ui/chart-panel/i18n
 * @since 0.1.0
 * @relatedTo CNGX_CHART_PANEL_CONFIG
 */
export const CNGX_CHART_PANEL_LANGUAGE_EN: CngxChartPanelLanguageSection = {
  busy: 'Updating',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly chartPanel: CngxChartPanelLanguageSection;
  }
}
