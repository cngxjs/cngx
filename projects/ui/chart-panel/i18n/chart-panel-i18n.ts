import { computed, inject, InjectionToken, type Signal } from '@angular/core';

import { injectLanguageSection } from '@cngx/core/i18n';
import { createOverrideMerge } from '@cngx/core/utils';

import {
  CNGX_CHART_PANEL_LANGUAGE_EN,
  type CngxChartPanelLanguageSection,
} from './chart-panel-language-section';

const NO_SECTION: Partial<CngxChartPanelLanguageSection> = {};

/** @internal The chart-panel section of the active pack over the English section. */
function chartPanelSectionFromPack(): Signal<CngxChartPanelLanguageSection> {
  const pack = injectLanguageSection('chartPanel');
  return createOverrideMerge(
    CNGX_CHART_PANEL_LANGUAGE_EN,
    computed(() => pack() ?? NO_SECTION),
  );
}

/**
 * @internal The chart-panel section of the active pack. Private: consumers
 * override copy through `withChartPanelAriaLabels`.
 */
const CHART_PANEL_SECTION = new InjectionToken<Signal<CngxChartPanelLanguageSection>>(
  'CngxChartPanelSection',
  { providedIn: 'root', factory: chartPanelSectionFromPack },
);

/** @internal The chart-panel section at the reading site. Injection context required. */
export function injectChartPanelSiteCopy(): Signal<CngxChartPanelLanguageSection> {
  return inject(CHART_PANEL_SECTION);
}
