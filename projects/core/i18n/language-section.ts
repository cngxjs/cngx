import { computed, inject, InjectionToken, type Signal } from '@angular/core';
import { createOverrideMerge } from '@cngx/core/utils';

import type { CngxLanguagePack } from './language-pack';
import { injectLanguageSection } from './provide-i18n';

const NO_SECTION = {};

/**
 * One area's section of the active language pack over its English section,
 * as a root-shared `Signal`. Call it once per area at module level and read
 * the returned accessor in an injection context: every reader app-wide gets
 * the same `Signal`, so config resolvers keyed on it memoize once. A key the
 * pack leaves out (or sets to `undefined`) reads English.
 *
 * The section is app-wide like the pack; locale-dependent formatting belongs
 * in {@link createSectionBundle}, which takes this accessor as its `section`.
 *
 * ```ts
 * export const injectTocSection = createLanguageSection('toc', CNGX_TOC_LANGUAGE_EN);
 * ```
 *
 * @category core/i18n
 * @since 0.1.0
 * @relatedTo injectLanguageSection, createSectionBundle
 */
export function createLanguageSection<K extends keyof CngxLanguagePack>(
  area: K,
  english: NonNullable<CngxLanguagePack[K]>,
): () => Signal<NonNullable<CngxLanguagePack[K]>> {
  type Section = NonNullable<CngxLanguagePack[K]>;
  const token = new InjectionToken<Signal<Section>>(`CngxLanguageSection:${String(area)}`, {
    providedIn: 'root',
    factory: () => {
      const pack = injectLanguageSection(area);
      return createOverrideMerge<Section>(
        english,
        computed(() => (pack() ?? NO_SECTION) as Partial<Section>),
      );
    },
  });
  return () => inject(token);
}
