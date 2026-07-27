/**
 * @module @cngx/ui/chart-panel
 */

export {
  CngxChartPanel,
  type CngxChartPanelLegendPosition,
} from './chart-panel.component';
export { type CngxChartPanelConfig } from './config/chart-panel.config';
export { CNGX_CHART_PANEL_CONFIG } from './config/chart-panel.config.defaults';
export {
  provideChartPanelConfig,
  provideChartPanelConfigAt,
  type CngxChartPanelConfigFeature,
} from './config/provide-chart-panel-config';
export { withChartPanelAriaLabels, withChartPanelLegendPosition } from './config/features';
export { injectChartPanelConfig } from './config/inject-chart-panel-config';
export {
  CngxChartPanelTitle,
  CngxChartPanelSubtitle,
  CngxChartPanelActions,
  CngxChartPanelFooter,
} from './chart-panel-slots';
export { CNGX_CHART_PANEL, type CngxChartPanelRegistry } from './chart-panel.token';
