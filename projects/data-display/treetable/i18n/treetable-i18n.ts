import { computed, inject, InjectionToken, type Signal } from '@angular/core';
import { createSectionBundle, formatMessage, injectLanguageSection } from '@cngx/core/i18n';
import { createNestedOverrideMerge, type CngxNestedOverrides } from '@cngx/core/utils';

import { CNGX_TREETABLE_CONFIG, type TreetableLabels } from '../treetable.token';
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
 * Reads the resolved treetable copy as a `Signal`: the `withTreetableLabels`
 * overrides of the nearest `CNGX_TREETABLE_CONFIG` over the `treetable`
 * section of the active language pack (English without one), formatted for
 * the locale of the reading injector. Every key is filled; a key the config
 * leaves unset reads the section, and `columnLabels` merges key by key. A
 * `provideLocaleAt` subtree formats its counts in that locale, and a
 * `provideTreetableAt` subtree reads its own label overrides.
 *
 * This is the same copy `CngxTreetable` renders and announces, so a custom
 * toolbar, header or selection summary built next to a treetable follows a
 * language switch. Read it inside a `computed()`, a template or a handler,
 * never at construction. Injection context required.
 *
 * ```typescript
 * export class AppSelectionSummary {
 *   private readonly labels = injectTreetableLabels();
 *   readonly count = input.required<number>();
 *   protected readonly text = computed(() => this.labels().rowsSelected(this.count()));
 * }
 * ```
 *
 * @category data-display/treetable
 * @github https://github.com/cngxjs/cngx/blob/main/projects/data-display/treetable/i18n/treetable-i18n.ts
 * @since 0.1.0
 * @relatedTo withTreetableLabels, provideTreetable, provideTreetableAt, TreetableLabels, CNGX_TREETABLE_LANGUAGE_EN
 */
export function injectTreetableLabels(): Signal<Required<TreetableLabels>> {
  const site = treetableBundle.resolve(inject(TREETABLE_SECTION_LABELS));
  return createNestedOverrideMerge<CngxResolvedTreetableLabels, 'columnLabels'>(
    site,
    inject(CNGX_TREETABLE_CONFIG).labels,
    'columnLabels',
  );
}
