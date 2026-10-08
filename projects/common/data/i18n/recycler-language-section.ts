import type { CngxMessage } from '@cngx/core/i18n';

/**
 * The recycler section of a {@link CngxLanguagePack}: the screen-reader
 * announcements of a virtualised list.
 *
 * @category common/data/i18n
 * @since 0.1.0
 * @relatedTo CNGX_RECYCLER_I18N
 */
export interface CngxRecyclerLanguageSection {
  /** Plural on `{count}` (new items), with `{total}`: announced after a load. */
  readonly loaded: CngxMessage;
  /** Plural on `{count}`: announced when filter or search results change. */
  readonly filtered: CngxMessage;
  /** Announced when the list becomes empty. */
  readonly empty: string;
  /** Announced when loading fails. */
  readonly error: string;
}

/**
 * The English recycler section: the single source of the recycler's English
 * copy. `CNGX_RECYCLER_I18N` defaults to it.
 *
 * @category common/data/i18n
 * @since 0.1.0
 * @relatedTo CNGX_RECYCLER_I18N
 */
export const CNGX_RECYCLER_LANGUAGE_EN: CngxRecyclerLanguageSection = {
  loaded: {
    one: '{count} more item loaded. {total} total.',
    other: '{count} more items loaded. {total} total.',
  },
  filtered: { one: '{count} result found.', other: '{count} results found.' },
  empty: 'No results',
  error: 'Error loading data',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly recycler: CngxRecyclerLanguageSection;
  }
}
