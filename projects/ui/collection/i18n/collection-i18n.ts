import { inject, InjectionToken, type Signal } from '@angular/core';

import { createLanguageSection, createSectionBundle, formatMessage } from '@cngx/core/i18n';

import type { CngxIncrementalListAriaLabels } from '../incremental-list-config';
import {
  CNGX_COLLECTION_LANGUAGE_EN,
  type CngxCollectionLanguageSection,
} from './collection-language-section';

/** @internal Turns a collection section into the incremental-list labels for a locale. Pure. */
export function collectionLabelsFrom(
  section: CngxCollectionLanguageSection,
  locale: string,
): CngxIncrementalListAriaLabels {
  return {
    loading: section.loading,
    empty: section.empty,
    error: section.error,
    pageError: section.pageError,
    retry: section.retry,
    endReached: (total) => formatMessage(section.endReached, { count: total }, locale),
    loadedMore: (count, total) => formatMessage(section.loadedMore, { count, total }, locale),
  };
}

/** @internal The collection section of the active pack over the English section. */
const injectCollectionLanguage = createLanguageSection('collection', CNGX_COLLECTION_LANGUAGE_EN);

/** @internal Builds and reads the section labels, formatted for the reading locale. */
const collectionBundle = createSectionBundle<
  CngxCollectionLanguageSection,
  CngxIncrementalListAriaLabels
>({
  section: injectCollectionLanguage,
  toBundle: collectionLabelsFrom,
});

/**
 * @internal The collection labels of the active pack, formatted for the app
 * locale. Private: consumers override copy through `withIncrementalListAriaLabels`.
 */
const COLLECTION_SECTION_LABELS = new InjectionToken<Signal<CngxIncrementalListAriaLabels>>(
  'CngxCollectionSectionLabels',
  { providedIn: 'root', factory: () => collectionBundle.build() },
);

/**
 * @internal The collection labels at the reading site: the active pack's
 * section formatted for the locale of the injector that reads it. Injection
 * context required.
 */
export function injectCollectionSiteLabels(): Signal<CngxIncrementalListAriaLabels> {
  return collectionBundle.resolve(inject(COLLECTION_SECTION_LABELS));
}
