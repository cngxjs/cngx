import { createLanguageSection } from '@cngx/core/i18n';

import { CNGX_CHART_PANEL_LANGUAGE_EN } from './chart-panel-language-section';

/**
 * @internal The chart-panel section of the active pack over the English section,
 * shared app-wide. Consumers override copy through `withChartPanelAriaLabels`.
 */
export const injectChartPanelSiteCopy = createLanguageSection(
  'chartPanel',
  CNGX_CHART_PANEL_LANGUAGE_EN,
);
