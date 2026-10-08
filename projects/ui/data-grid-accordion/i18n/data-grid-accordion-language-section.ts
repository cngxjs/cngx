import type { CngxMessage } from '@cngx/core/i18n';

/**
 * The data-grid-accordion section of a {@link CngxLanguagePack}: the copy of
 * every `@cngx/ui/data-grid-accordion` part. It feeds the `labels` of
 * `CNGX_DATA_GRID_ACCORDION_CONFIG`; a key set through
 * `withDataGridAccordionLabels` still wins. Messages use `{name}`
 * placeholders, numbers are formatted for the locale.
 *
 * @category ui/data-grid-accordion/i18n
 * @since 0.1.0
 * @relatedTo CNGX_DATA_GRID_ACCORDION_CONFIG, withDataGridAccordionLabels
 */
export interface CngxDataGridAccordionLanguageSection {
  /** `{count}`: the `CngxDgaCount` live-region text for a visible-row count. */
  readonly count: CngxMessage;
  /** Default of `[cngxDgaCountSingular]`. */
  readonly countSingular: string;
  /** Default of `[cngxDgaCountPlural]`. */
  readonly countPlural: string;
  /** `{count}`, `{noun}`: the count with a noun bound on `CngxDgaCount`. */
  readonly countWithNoun: CngxMessage;
  /** Default of `[cngxDgaSortStatusNotSorted]`, the described sort status while unsorted. */
  readonly sortNone: string;
  /** Default of `[cngxDgaSortStatusAscending]`. */
  readonly sortAscending: string;
  /** Default of `[cngxDgaSortStatusDescending]`. */
  readonly sortDescending: string;
  /** `{label}`: default of `[cngxDgaSortAnnounceAscending]`, `{label}` is the column name. */
  readonly sortAnnouncedAscending: string;
  /** `{label}`: default of `[cngxDgaSortAnnounceDescending]`. */
  readonly sortAnnouncedDescending: string;
  /** `{label}`: default of `[cngxDgaSortAnnounceCleared]`. */
  readonly sortAnnouncedCleared: string;
  /** The column name of a sort announcement when the header has no label and no text. */
  readonly unlabeledColumn: string;
  /** Default of the `CngxDgaFilterField` visible `[label]`. */
  readonly filter: string;
  /** Default of `[cngxDgaFilterLabel]`, the filter box accessible name. */
  readonly filterRows: string;
  /** Default of the `CngxDataGridRow` `[errorMessage]`. */
  readonly rowLoadFailed: string;
  /** Decorative tag the skins draw before a row's detail region. */
  readonly note: string;
}

/**
 * The English data-grid-accordion section: the single source of the entry's
 * English copy. The `CNGX_DATA_GRID_ACCORDION_CONFIG` labels default to it.
 *
 * @category ui/data-grid-accordion/i18n
 * @since 0.1.0
 * @relatedTo CNGX_DATA_GRID_ACCORDION_CONFIG
 */
export const CNGX_DATA_GRID_ACCORDION_LANGUAGE_EN: CngxDataGridAccordionLanguageSection = {
  count: { one: '{count} result', other: '{count} results' },
  countSingular: 'result',
  countPlural: 'results',
  countWithNoun: '{count} {noun}',
  sortNone: 'not sorted, activate to sort ascending',
  sortAscending: 'sorted ascending, activate to sort descending',
  sortDescending: 'sorted descending, activate to sort ascending',
  sortAnnouncedAscending: 'Sorted by {label} ascending',
  sortAnnouncedDescending: 'Sorted by {label} descending',
  sortAnnouncedCleared: 'Sorting by {label} cleared',
  unlabeledColumn: 'this column',
  filter: 'Filter',
  filterRows: 'Filter rows',
  rowLoadFailed: 'Could not load',
  note: 'NOTE',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly dataGridAccordion: CngxDataGridAccordionLanguageSection;
  }
}
