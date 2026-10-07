import type { Signal } from '@angular/core';

import type { CngxChartPanelLegendPosition } from '../chart-panel.component';

/**
 * String fallbacks for the chart-panel's non-content states. Every key is
 * optional; an unset key keeps the English default.
 *
 * @category ui/chart-panel
 * @since 0.1.0
 */
export interface CngxChartPanelAriaLabels {
  /** Accessible name announced while a panel-level operation runs. */
  readonly busy?: string;
}

/**
 * App-wide cascade for the chart-panel's ARIA strings and its default legend
 * placement.
 *
 * Resolution priority (high -> low):
 *   1. Per-instance Input binding (e.g. `[legendPosition]`).
 *   2. `provideChartPanelConfigAt(...)` in a parent component's `viewProviders`.
 *   3. `provideChartPanelConfig(...)` at the application root.
 *   4. Library defaults (`CNGX_CHART_PANEL_DEFAULTS`; the strings come from
 *      the `chartPanel` section of the language pack).
 *
 * @category ui/chart-panel
 * @since 0.1.0
 */
export interface CngxChartPanelConfig {
  /**
   * String fallbacks for the panel's non-content states. Accepts a `Signal`
   * so the strings follow a runtime language switch; read the resolved bundle
   * through {@link injectChartPanelAriaLabels}.
   */
  readonly ariaLabels?: CngxChartPanelAriaLabels | Signal<CngxChartPanelAriaLabels>;

  /** App-wide default legend placement. Per-instance `[legendPosition]` wins. */
  readonly legendPosition?: CngxChartPanelLegendPosition;
}
