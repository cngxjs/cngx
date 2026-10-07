import type { CngxMessage } from '@cngx/core/i18n';

/**
 * The treetable section of a {@link CngxLanguagePack}: the copy of
 * `@cngx/data-display/treetable`. It feeds the `labels` of
 * `CNGX_TREETABLE_CONFIG`; a key set through `withTreetableLabels` still wins.
 * Messages use `{name}` placeholders; a plural message picks its form from
 * `{count}`.
 *
 * @category data-display/treetable
 * @since 0.1.0
 * @relatedTo CNGX_TREETABLE_CONFIG, withTreetableLabels
 */
export interface CngxTreetableLanguageSection {
  /** Live-region announcement while the first load runs. */
  readonly loading: string;
  /** Live-region announcement and indicator text during a refresh over content. */
  readonly refreshing: string;
  /** Visible error text and its live-region announcement when a load fails. */
  readonly errorFallback: string;
  /** Visible text of the default empty surface. */
  readonly emptyFallback: string;
  /** `aria-label` of a collapsed row's expand toggle. */
  readonly expand: string;
  /** `aria-label` of an expanded row's collapse toggle. */
  readonly collapse: string;
  /** `aria-label` of the header "select all" checkbox. */
  readonly selectAll: string;
  /** `aria-label` of a body row's selection checkbox. */
  readonly selectRow: string;
  /** Plural on `{count}`: announced after select-all selects the visible rows. */
  readonly rowsSelected: CngxMessage;
  /** Plural on `{count}`: announced after select-all deselects the visible rows. */
  readonly rowsDeselected: CngxMessage;
  /**
   * Column header labels by column key. A column without a label and without
   * a `*cngxHeader` template reads `unlabeledColumn`; dev builds show the key
   * instead and warn once per key.
   */
  readonly columnLabels: Readonly<Record<string, string>>;
  /** `{position}`: header of a column without a label, 1-based among the data columns. */
  readonly unlabeledColumn: CngxMessage;
}

/**
 * The English treetable section: the single source of the treetable's English
 * copy. The `CNGX_TREETABLE_CONFIG` labels default to it.
 *
 * @category data-display/treetable
 * @since 0.1.0
 * @relatedTo CNGX_TREETABLE_CONFIG, withTreetableLabels
 */
export const CNGX_TREETABLE_LANGUAGE_EN: CngxTreetableLanguageSection = {
  loading: 'Loading',
  refreshing: 'Refreshing',
  errorFallback: 'Data failed to load',
  emptyFallback: 'No data',
  expand: 'Expand',
  collapse: 'Collapse',
  selectAll: 'Select all rows',
  selectRow: 'Select row',
  rowsSelected: { one: '{count} row selected', other: '{count} rows selected' },
  rowsDeselected: { one: '{count} row deselected', other: '{count} rows deselected' },
  columnLabels: {},
  unlabeledColumn: 'Column {position}',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly treetable: CngxTreetableLanguageSection;
  }
}
