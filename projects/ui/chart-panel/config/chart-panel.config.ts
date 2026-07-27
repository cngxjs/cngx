import type { CngxLoadingTreatment } from '@cngx/core/utils';

import type { CngxChartPanelLegendPosition } from '../chart-panel.component';

/**
 * App-wide cascade for the chart-panel's ARIA strings, its default legend
 * placement, and its default loading treatment.
 *
 * Resolution priority (high -> low):
 *   1. Per-instance Input binding (e.g. `[legendPosition]`).
 *   2. `provideChartPanelConfigAt(...)` in a parent component's `viewProviders`.
 *   3. `provideChartPanelConfig(...)` at the application root.
 *   4. Library defaults (English; merged in via `CNGX_CHART_PANEL_DEFAULTS`).
 *
 * @category ui/chart-panel
 * @since 0.1.0
 */
export interface CngxChartPanelConfig {
  /** String fallbacks for the panel's non-content states. */
  readonly ariaLabels?: {
    /** Accessible name announced while a panel-level operation runs. */
    readonly busy?: string;
  };

  /** App-wide default legend placement. Per-instance `[legendPosition]` wins. */
  readonly legendPosition?: CngxChartPanelLegendPosition;

  /** App-wide default placeholder treatment. Per-instance `[loadingTreatment]` wins. */
  readonly loadingTreatment?: CngxLoadingTreatment;
}
