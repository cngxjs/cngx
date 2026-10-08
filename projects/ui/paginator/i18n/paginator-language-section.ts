import type { CngxMessage } from '@cngx/core/i18n';

/**
 * The paginator section of a {@link CngxLanguagePack}: the copy of every
 * `@cngx/ui/paginator` segment. It feeds the `ariaLabels`, `announcements` and
 * `formats` of `CNGX_PAGINATOR_CONFIG`; a key set through
 * `withPaginatorAriaLabels`, `withPaginatorAnnouncements` or a
 * `withPaginator*Format` feature still wins. Messages use `{name}`
 * placeholders, numbers are formatted for the locale.
 *
 * The readout messages (`range`, `pageStatus`, `pageOfPagesReadout`) render as
 * sanitised HTML, so they may emphasise the current value with `<b>`.
 *
 * @category ui/paginator/i18n
 * @since 0.1.0
 * @relatedTo CNGX_PAGINATOR_CONFIG, withPaginatorAriaLabels, withPaginatorAnnouncements
 */
export interface CngxPaginatorLanguageSection {
  /** Accessible name of the paginator landmark. */
  readonly label: string;
  /** Accessible name of the first-page button. */
  readonly first: string;
  /** Accessible name of the previous-page button. */
  readonly previous: string;
  /** Accessible name of the next-page button. */
  readonly next: string;
  /** Accessible name of the last-page button. */
  readonly last: string;
  /** `{page}`: accessible name of a numbered page button. */
  readonly page: CngxMessage;
  /** Accessible name of the hidden-pages overflow trigger. */
  readonly morePages: string;
  /** Accessible name of the page-size select. */
  readonly itemsPerPage: string;
  /** Accessible name of the go-to-page input. */
  readonly goToPage: string;
  /** Accessible name of the page-of-pages select. */
  readonly pageOfPages: string;
  /** Accessible name of the load-more button. */
  readonly loadMore: string;
  /** `{total}`: text once every item is loaded. */
  readonly allLoaded: CngxMessage;
  /** `{label}`: accessible name of an alphabet bucket. */
  readonly bucket: CngxMessage;
  /** `{label}`: accessible name of an alphabet bucket without items. */
  readonly emptyBucket: CngxMessage;
  /** Accessible name of the alphabet bucket group. */
  readonly bucketGroup: string;
  /** Accessible name of the position rail. */
  readonly railPosition: string;
  /** `{page}`, `{totalPages}`: announced on every page change. */
  readonly pageChange: CngxMessage;
  /** Announced when the bound async state becomes busy. */
  readonly loading: string;
  /** Announced when the bound async state settles after being busy. */
  readonly updated: string;
  /** `{start}`, `{end}`, `{total}`: the `cngx-pgn-range` readout (HTML). */
  readonly range: CngxMessage;
  /** `{page}`, `{totalPages}`: the `cngx-pgn-status` readout (HTML). */
  readonly pageStatus: CngxMessage;
  /** `{page}`, `{totalPages}`: the `cngx-pgn-page-of-pages` trigger readout (HTML). */
  readonly pageOfPagesReadout: CngxMessage;
  /** `{shown}`, `{total}`: the `cngx-pgn-load-more` progress readout. */
  readonly loadMoreReadout: CngxMessage;
}

/**
 * The English paginator section: the single source of the paginator's English
 * copy. The `CNGX_PAGINATOR_CONFIG` copy sub-trees default to it.
 *
 * @category ui/paginator/i18n
 * @since 0.1.0
 * @relatedTo CNGX_PAGINATOR_CONFIG
 */
export const CNGX_PAGINATOR_LANGUAGE_EN: CngxPaginatorLanguageSection = {
  label: 'Pagination',
  first: 'First page',
  previous: 'Previous page',
  next: 'Next page',
  last: 'Last page',
  page: 'Page {page}',
  morePages: 'More pages',
  itemsPerPage: 'Items per page',
  goToPage: 'Go to page',
  pageOfPages: 'Select page',
  loadMore: 'Load more',
  allLoaded: 'All {total} loaded',
  bucket: '{label}',
  emptyBucket: '{label}, no items',
  bucketGroup: 'Categories',
  railPosition: 'Page position',
  pageChange: 'Page {page} of {totalPages}',
  loading: 'Loading',
  updated: 'Updated',
  range: '<b>{start}–{end}</b> of {total}',
  pageStatus: 'Page <b>{page}</b> of {totalPages}',
  pageOfPagesReadout: '<b>{page}</b> / {totalPages}',
  loadMoreReadout: '{shown} / {total}',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly paginator: CngxPaginatorLanguageSection;
  }
}
