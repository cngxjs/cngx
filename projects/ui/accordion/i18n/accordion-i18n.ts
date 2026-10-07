import { computed, inject, InjectionToken, type Signal } from '@angular/core';

import { injectLanguageSection } from '@cngx/core/i18n';
import { createOverrideMerge } from '@cngx/core/utils';

import {
  CNGX_ACCORDION_LANGUAGE_EN,
  type CngxAccordionLanguageSection,
} from './accordion-language-section';

const NO_SECTION: Partial<CngxAccordionLanguageSection> = {};

/** @internal The accordion section of the active pack over the English section. */
function accordionSectionFromPack(): Signal<CngxAccordionLanguageSection> {
  const pack = injectLanguageSection('accordion');
  return createOverrideMerge(
    CNGX_ACCORDION_LANGUAGE_EN,
    computed(() => pack() ?? NO_SECTION),
  );
}

/**
 * @internal The accordion section of the active pack. Private: consumers
 * override copy through `withAccordionLabels`.
 */
const ACCORDION_SECTION = new InjectionToken<Signal<CngxAccordionLanguageSection>>(
  'CngxAccordionSection',
  { providedIn: 'root', factory: accordionSectionFromPack },
);

/** @internal The accordion section at the reading site. Injection context required. */
export function injectAccordionSiteCopy(): Signal<CngxAccordionLanguageSection> {
  return inject(ACCORDION_SECTION);
}
