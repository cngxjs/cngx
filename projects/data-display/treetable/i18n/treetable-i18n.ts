import { computed, inject, InjectionToken, type Signal } from '@angular/core';
import { createSectionBundle, formatMessage, injectLanguageSection } from '@cngx/core/i18n';
import { createNestedOverrideMerge, type CngxNestedOverrides } from '@cngx/core/utils';

import type { TreetableLabels } from '../treetable.token';
import {
  CNGX_TREETABLE_LANGUAGE_EN,
  type CngxTreetableLanguageSection,
} from './treetable-language-section';

/**
 * The treetable labels with every key filled.
 *
 * @internal
 */
export type CngxResolvedTreetableLabels = Required<TreetableLabels>;

const NO_SECTION: CngxNestedOverrides<CngxTreetableLanguageSection, 'columnLabels'> = {};

/**
 * @internal The treetable section of the active pack over the English section;
 * `columnLabels` merges key by key.
 */
function injectTreetableLanguage(): Signal<CngxTreetableLanguageSection> {
  const pack = injectLanguageSection('treetable');
  return createNestedOverrideMerge<CngxTreetableLanguageSection, 'columnLabels'>(
    CNGX_TREETABLE_LANGUAGE_EN,
    computed(() => pack() ?? NO_SECTION),
    'columnLabels',
  );
}

/** @internal Turns a treetable section into the labels for a locale. Pure. */
export function treetableLabelsFrom(
  section: CngxTreetableLanguageSection,
  locale: string,
): CngxResolvedTreetableLabels {
  return {
    loading: section.loading,
    refreshing: section.refreshing,
    errorFallback: section.errorFallback,
    emptyFallback: section.emptyFallback,
    expand: section.expand,
    collapse: section.collapse,
    selectAll: section.selectAll,
    selectRow: section.selectRow,
    rowsSelected: (count) => formatMessage(section.rowsSelected, { count }, locale),
    rowsDeselected: (count) => formatMessage(section.rowsDeselected, { count }, locale),
    columnLabels: section.columnLabels,
    unlabeledColumn: (position) => formatMessage(section.unlabeledColumn, { position }, locale),
  };
}

/** @internal Builds and reads the section labels, formatted for the reading locale. */
const treetableBundle = createSectionBundle<
  CngxTreetableLanguageSection,
  CngxResolvedTreetableLabels
>({
  section: injectTreetableLanguage,
  toBundle: treetableLabelsFrom,
});

/**
 * @internal The treetable section labels of the active pack, formatted for the
 * app locale. Private: consumers override copy through `withTreetableLabels`.
 */
const TREETABLE_SECTION_LABELS = new InjectionToken<Signal<CngxResolvedTreetableLabels>>(
  'CngxTreetableSectionLabels',
  { providedIn: 'root', factory: () => treetableBundle.build() },
);

/**
 * @internal The treetable labels at the reading site: the active pack's
 * treetable section formatted for the locale of the injector that reads it
 * (a `provideLocaleAt` subtree formats with its own locale), with the
 * `CNGX_TREETABLE_CONFIG` labels on top. A key the config sets wins;
 * `columnLabels` merges key by key. Injection context required.
 */
export function injectTreetableLabels(
  overrides: Partial<TreetableLabels> | Signal<Partial<TreetableLabels>> | undefined,
): Signal<CngxResolvedTreetableLabels> {
  const site = treetableBundle.resolve(inject(TREETABLE_SECTION_LABELS));
  return createNestedOverrideMerge<CngxResolvedTreetableLabels, 'columnLabels'>(
    site,
    overrides,
    'columnLabels',
  );
}
