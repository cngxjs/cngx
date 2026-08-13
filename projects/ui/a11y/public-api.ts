/**
 * @module @cngx/ui/a11y
 */

export { CngxA11yPanel } from './a11y-panel.component';

export {
  CNGX_A11Y_PANEL_CONFIG,
  CNGX_A11Y_PANEL_DEFAULTS,
  provideA11yPanelConfig,
  provideA11yPanelConfigAt,
  withA11yPanelLabels,
  withA11yPanelAxes,
  injectA11yPanelConfig,
} from './a11y-panel.config';
export type {
  CngxA11yPanelConfig,
  CngxA11yPanelAxis,
  CngxA11yPanelAxisSpec,
  CngxA11yPanelAxisOption,
  CngxA11yPanelLabels,
  CngxA11yPanelLabelsOverride,
  CngxA11yPanelConfigFeature,
} from './a11y-panel.config';
