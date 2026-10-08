import { computed, inject, InjectionToken, type Signal } from '@angular/core';

import { createLanguageSection, createSectionBundle } from '@cngx/core/i18n';
import { recordEqual } from '@cngx/utils';

import type { CngxA11yPanelAxis, CngxA11yPanelLabels } from '../a11y-panel.config';
import {
  CNGX_A11Y_PANEL_LANGUAGE_EN,
  type CngxA11yPanelLanguageSection,
} from './a11y-panel-language-section';

/** @internal Option labels by axis, then by value. */
export type CngxA11yPanelOptionLabels = Readonly<
  Record<CngxA11yPanelAxis, Readonly<Record<string, string>>>
>;

/** @internal The panel copy of one section, split into config labels and option labels. */
export interface CngxA11yPanelCopy {
  readonly labels: CngxA11yPanelLabels;
  readonly options: CngxA11yPanelOptionLabels;
}

/** @internal Turns an accessibility-panel section into the panel copy. Pure. */
export function a11yPanelCopyFrom(section: CngxA11yPanelLanguageSection): CngxA11yPanelCopy {
  return {
    labels: {
      axes: section.axes,
      reset: section.reset,
      heading: section.heading,
      resetMessage: section.resetMessage,
    },
    options: {
      density: section.density,
      textScale: section.textScale,
      motion: section.motion,
      contrast: section.contrast,
    },
  };
}

/** @internal The accessibility-panel section of the active pack over the English section. */
const injectA11yPanelLanguage = createLanguageSection('a11yPanel', CNGX_A11Y_PANEL_LANGUAGE_EN);

/** @internal Builds and reads the section copy. */
const a11yPanelBundle = createSectionBundle<CngxA11yPanelLanguageSection, CngxA11yPanelCopy>({
  section: injectA11yPanelLanguage,
  toBundle: a11yPanelCopyFrom,
});

/**
 * @internal The panel copy of the active pack. Private: consumers override the
 * text through `withA11yPanelLabels`, option labels through `withA11yPanelAxes`.
 */
const A11Y_PANEL_SECTION_COPY = new InjectionToken<Signal<CngxA11yPanelCopy>>(
  'CngxA11yPanelSectionCopy',
  { providedIn: 'root', factory: () => a11yPanelBundle.build() },
);

interface SiteDefaults {
  readonly labels: Signal<CngxA11yPanelLabels>;
  readonly options: Signal<CngxA11yPanelOptionLabels>;
}

const SITES = new WeakMap<Signal<CngxA11yPanelCopy>, SiteDefaults>();

/**
 * @internal The panel copy at the reading site, each part its own signal.
 * Memoized per copy signal. Injection context required.
 */
export function injectA11yPanelSiteCopy(): SiteDefaults {
  const copy = a11yPanelBundle.resolve(inject(A11Y_PANEL_SECTION_COPY));
  let site = SITES.get(copy);
  if (!site) {
    site = {
      labels: computed(() => copy().labels),
      options: computed(() => copy().options, { equal: recordEqual }),
    };
    SITES.set(copy, site);
  }
  return site;
}
