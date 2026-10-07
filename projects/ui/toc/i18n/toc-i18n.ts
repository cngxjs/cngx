import { computed, inject, InjectionToken, type Signal } from '@angular/core';

import { injectLanguageSection } from '@cngx/core/i18n';
import { createOverrideMerge } from '@cngx/core/utils';

import { CNGX_TOC_LANGUAGE_EN, type CngxTocLanguageSection } from './toc-language-section';

const NO_SECTION: Partial<CngxTocLanguageSection> = {};

/** @internal The toc section of the active pack over the English section. */
function tocSectionFromPack(): Signal<CngxTocLanguageSection> {
  const pack = injectLanguageSection('toc');
  return createOverrideMerge(
    CNGX_TOC_LANGUAGE_EN,
    computed(() => pack() ?? NO_SECTION),
  );
}

/**
 * @internal The toc section of the active pack. Private: consumers
 * override copy through `withTocAriaLabels`.
 */
const TOC_SECTION = new InjectionToken<Signal<CngxTocLanguageSection>>('CngxTocSection', {
  providedIn: 'root',
  factory: tocSectionFromPack,
});

/** @internal The toc section at the reading site. Injection context required. */
export function injectTocSiteCopy(): Signal<CngxTocLanguageSection> {
  return inject(TOC_SECTION);
}
