import { inject } from '@angular/core';

import type { CngxChartPanelConfig } from './chart-panel.config';
import { CNGX_CHART_PANEL_CONFIG } from './chart-panel.config.defaults';

/**
 * Convenience accessor for the chart-panel configuration cascade. Runs in
 * injection context; resolves through the priority chain (per-instance Input
 * -> `provideChartPanelConfigAt` -> `provideChartPanelConfig` -> library
 * defaults). Equivalent to `inject(CNGX_CHART_PANEL_CONFIG)` - the helper
 * exists so consumers don't import the token directly.
 *
 * @category ui/chart-panel
 * @since 0.1.0
 */
export function injectChartPanelConfig(): CngxChartPanelConfig {
  return inject(CNGX_CHART_PANEL_CONFIG);
}
