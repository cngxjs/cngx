import type { Signal } from '@angular/core';

import type { CngxChartPanelLegendPosition } from '../chart-panel.component';
import type { CngxChartPanelAriaLabels } from './chart-panel.config';
import type { CngxChartPanelConfigFeature } from './provide-chart-panel-config';

/**
 * Override the chart-panel's string fallbacks. The defaults come from the
 * `chartPanel` section of the language pack (English without one); this
 * overrides single keys on top of it. Pass a `Signal` to switch the
 * language at runtime; the busy status speaks the new language with the next
 * busy phase.
 *
 * @category ui/chart-panel
 * @since 0.1.0
 */
export function withChartPanelAriaLabels(
  labels: CngxChartPanelAriaLabels | Signal<CngxChartPanelAriaLabels>,
): CngxChartPanelConfigFeature {
  return { kind: 'ariaLabels', payload: labels };
}

/**
 * Move the cascade default for where a projected `cngx-chart-legend` sits.
 * Per-instance `[legendPosition]` still wins.
 *
 * @category ui/chart-panel
 * @since 0.1.0
 */
export function withChartPanelLegendPosition(
  position: CngxChartPanelLegendPosition,
): CngxChartPanelConfigFeature {
  return { kind: 'legendPosition', payload: { legendPosition: position } };
}
