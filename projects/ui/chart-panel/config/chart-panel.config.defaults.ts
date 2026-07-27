import { InjectionToken } from '@angular/core';

import type { CngxChartPanelConfig } from './chart-panel.config';

/**
 * Library defaults for the chart-panel configuration cascade. English by
 * default; locale overrides ride the `withChartPanelAriaLabels` feature. The
 * values are byte-identical to the per-instance input defaults the component
 * shipped before the cascade, so an un-configured consumer sees no change.
 *
 * Exported for intra-lib consumers but **NOT** re-exported from
 * `public-api.ts` - downstream consumers reach the defaults via
 * `inject(CNGX_CHART_PANEL_CONFIG)`.
 *
 * @internal
 */
export const CNGX_CHART_PANEL_DEFAULTS: CngxChartPanelConfig = {
  ariaLabels: {
    busy: 'Updating',
  },
  legendPosition: 'bottom',
};

/**
 * App-wide configuration cascade for the chart-panel. `providedIn: 'root'`
 * with a default factory, so `inject(CNGX_CHART_PANEL_CONFIG)` always
 * resolves.
 *
 * @category ui/chart-panel
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/chart-panel/config/chart-panel.config.defaults.ts
 * @since 0.1.0
 * @relatedTo provideChartPanelConfig, provideChartPanelConfigAt, injectChartPanelConfig
 */
export const CNGX_CHART_PANEL_CONFIG = new InjectionToken<CngxChartPanelConfig>(
  'CNGX_CHART_PANEL_CONFIG',
  {
    providedIn: 'root',
    factory: () => CNGX_CHART_PANEL_DEFAULTS,
  },
);
