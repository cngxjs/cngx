import { computed, inject, InjectionToken, type Signal } from '@angular/core';

import { injectLanguageSection } from '@cngx/core/i18n';
import { createOverrideMerge } from '@cngx/core/utils';

import {
  CNGX_STAT_CARD_LANGUAGE_EN,
  type CngxStatCardLanguageSection,
} from './stat-card-language-section';

const NO_SECTION: Partial<CngxStatCardLanguageSection> = {};

/** @internal The stat-card section of the active pack over the English section. */
function statCardSectionFromPack(): Signal<CngxStatCardLanguageSection> {
  const pack = injectLanguageSection('statCard');
  return createOverrideMerge(
    CNGX_STAT_CARD_LANGUAGE_EN,
    computed(() => pack() ?? NO_SECTION),
  );
}

/**
 * @internal The stat-card section of the active pack. Private: consumers
 * override copy through `withStatCardAriaLabels`.
 */
const STAT_CARD_SECTION = new InjectionToken<Signal<CngxStatCardLanguageSection>>(
  'CngxStatCardSection',
  { providedIn: 'root', factory: statCardSectionFromPack },
);

/** @internal The stat-card section at the reading site. Injection context required. */
export function injectStatCardSiteCopy(): Signal<CngxStatCardLanguageSection> {
  return inject(STAT_CARD_SECTION);
}
