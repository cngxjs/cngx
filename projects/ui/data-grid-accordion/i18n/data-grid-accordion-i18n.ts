import { computed, inject, InjectionToken, type Signal } from '@angular/core';

import { createSectionBundle, formatMessage, injectLanguageSection } from '@cngx/core/i18n';
import { createFilledOverrideMerge, createOverrideMerge } from '@cngx/core/utils';

import type { CngxDataGridAccordionLabels } from '../config/data-grid-accordion.config';
import { CNGX_DATA_GRID_ACCORDION_CONFIG } from '../config/data-grid-accordion.config.defaults';
import {
  CNGX_DATA_GRID_ACCORDION_LANGUAGE_EN,
  type CngxDataGridAccordionLanguageSection,
} from './data-grid-accordion-language-section';

/** @internal Turns a data-grid-accordion section into the config labels for a locale. Pure. */
export function dataGridAccordionLabelsFrom(
  section: CngxDataGridAccordionLanguageSection,
  locale: string,
): CngxDataGridAccordionLabels {
  return {
    count: (count) => formatMessage(section.count, { count }, locale),
    countSingular: section.countSingular,
    countPlural: section.countPlural,
    countWithNoun: (count, noun) => formatMessage(section.countWithNoun, { count, noun }, locale),
    sortNone: section.sortNone,
    sortAscending: section.sortAscending,
    sortDescending: section.sortDescending,
    sortAnnouncedAscending: section.sortAnnouncedAscending,
    sortAnnouncedDescending: section.sortAnnouncedDescending,
    sortAnnouncedCleared: section.sortAnnouncedCleared,
    unlabeledColumn: section.unlabeledColumn,
    filter: section.filter,
    filterRows: section.filterRows,
    rowLoadFailed: section.rowLoadFailed,
    note: section.note,
  };
}

const NO_SECTION: Partial<CngxDataGridAccordionLanguageSection> = {};

/** @internal The data-grid-accordion section of the active pack over the English section. */
function injectDataGridAccordionLanguage(): Signal<CngxDataGridAccordionLanguageSection> {
  const pack = injectLanguageSection('dataGridAccordion');
  return createOverrideMerge(
    CNGX_DATA_GRID_ACCORDION_LANGUAGE_EN,
    computed(() => pack() ?? NO_SECTION),
  );
}

/** @internal Builds and reads the section labels, formatted for the reading locale. */
const dataGridAccordionBundle = createSectionBundle<
  CngxDataGridAccordionLanguageSection,
  CngxDataGridAccordionLabels
>({
  section: injectDataGridAccordionLanguage,
  toBundle: dataGridAccordionLabelsFrom,
});

/**
 * @internal The section labels of the active pack, formatted for the app
 * locale. Private: consumers override copy through `withDataGridAccordionLabels`.
 */
const DATA_GRID_ACCORDION_SECTION_LABELS = new InjectionToken<Signal<CngxDataGridAccordionLabels>>(
  'CngxDataGridAccordionSectionLabels',
  {
    providedIn: 'root',
    factory: () => dataGridAccordionBundle.build(),
  },
);

/**
 * @internal The data-grid-accordion labels at the reading site: the active
 * pack's section formatted for the locale of the injector that reads it, with
 * the `CNGX_DATA_GRID_ACCORDION_CONFIG` labels on top. A key the config sets
 * wins; a key it leaves unset, `null` or `undefined` reads the section.
 * Injection context required.
 */
export function injectDataGridAccordionLabels(): Signal<CngxDataGridAccordionLabels> {
  const section = dataGridAccordionBundle.resolve(inject(DATA_GRID_ACCORDION_SECTION_LABELS));
  return createFilledOverrideMerge<CngxDataGridAccordionLabels>(
    section,
    inject(CNGX_DATA_GRID_ACCORDION_CONFIG).labels,
  );
}
