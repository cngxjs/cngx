import { inject, type Signal } from '@angular/core';
import { createOverrideMerge } from '@cngx/core/utils';

import type { CngxChartPanelAriaLabels, CngxChartPanelConfig } from './chart-panel.config';
import {
  CNGX_CHART_PANEL_ARIA_LABELS_DEFAULTS,
  CNGX_CHART_PANEL_CONFIG,
} from './chart-panel.config.defaults';

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

/**
 * The resolved strings of the chart-panel config in scope, every key filled
 * from the English defaults, as a Signal that follows a runtime language
 * switch. Runs in injection context; read it inside a `computed()`, a
 * template or a handler, and untracked where it builds live-region text.
 *
 * @category ui/chart-panel
 * @since 0.1.0
 */
export function injectChartPanelAriaLabels(): Signal<Required<CngxChartPanelAriaLabels>> {
  return createOverrideMerge(
    CNGX_CHART_PANEL_ARIA_LABELS_DEFAULTS,
    injectChartPanelConfig().ariaLabels,
  );
}
