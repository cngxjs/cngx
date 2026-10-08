import type { CngxMessage } from '@cngx/core/i18n';

/**
 * The collection section of a {@link CngxLanguagePack}: the copy of
 * `CngxIncrementalList`, its built-in views and its live region. It feeds the
 * `ariaLabels` of `CNGX_INCREMENTAL_LIST_CONFIG`; a key set through
 * `withIncrementalListAriaLabels` still wins. Messages use `{name}`
 * placeholders, numbers are formatted for the locale.
 *
 * @category ui/collection/i18n
 * @since 0.1.0
 * @relatedTo CNGX_INCREMENTAL_LIST_CONFIG, withIncrementalListAriaLabels
 */
export interface CngxCollectionLanguageSection {
  /** Busy indicator label while the first load runs. */
  readonly loading: string;
  /** Empty-view text when the list settles with no data. */
  readonly empty: string;
  /** Error-view text when the first load fails. */
  readonly error: string;
  /** Error text when a later page fails and the loaded rows stay visible. */
  readonly pageError: string;
  /** Label of the retry button on the built-in error view. */
  readonly retry: string;
  /** `{count}`: the number of items once every page is loaded. */
  readonly endReached: CngxMessage;
  /** `{count}`: rows newly loaded, `{total}`: rows loaded so far. Announced under `[virtualize]`. */
  readonly loadedMore: CngxMessage;
}

/**
 * The English collection section: the single source of the incremental
 * list's English copy. The `CNGX_INCREMENTAL_LIST_CONFIG` labels default to it.
 *
 * @category ui/collection/i18n
 * @since 0.1.0
 * @relatedTo CNGX_INCREMENTAL_LIST_CONFIG
 */
export const CNGX_COLLECTION_LANGUAGE_EN: CngxCollectionLanguageSection = {
  loading: 'Loading',
  empty: 'Nothing here yet',
  error: 'Could not load',
  pageError: 'Could not load more',
  retry: 'Retry',
  endReached: 'All {count} loaded',
  loadedMore: '{count} more loaded. {total} total.',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly collection: CngxCollectionLanguageSection;
  }
}
