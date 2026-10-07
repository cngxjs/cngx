/**
 * @module @cngx/ui/collection
 */

export { CngxIncrementalList, type CngxIncrementalListSkin } from './incremental-list.component';
export { CNGX_PAGINATOR_HOST, type CngxPaginatorHost } from './incremental-list-host.token';
export {
  CngxIncrementalItem,
  CngxIncrementalEmpty,
  CngxIncrementalError,
  CngxIncrementalEnd,
  CngxIncrementalLoading,
  type CngxIncrementalItemContext,
  type CngxIncrementalErrorContext,
} from './incremental-list-slots';
export {
  CNGX_INCREMENTAL_LIST_CONFIG,
  CNGX_INCREMENTAL_LIST_DEFAULTS,
  provideIncrementalListConfig,
  provideIncrementalListConfigAt,
  injectIncrementalListAriaLabels,
  injectIncrementalListConfig,
  withIncrementalListAriaLabels,
  withIncrementalListTemplates,
  type CngxIncrementalListConfig,
  type CngxIncrementalListConfigFeature,
  type CngxIncrementalListAriaLabels,
  type CngxIncrementalListTemplates,
} from './incremental-list-config';
export {
  CNGX_COLLECTION_LANGUAGE_EN,
  type CngxCollectionLanguageSection,
} from './i18n/collection-language-section';

// Trigger atoms re-exported for discoverability - a projected trigger injects
// the shared CNGX_PAGINATOR_HOST the organism provides. No new component; these
// are the existing terminal trigger units from @cngx/ui/paginator.
export { CngxPaginatorLoadMore, CngxPaginatorInfinite } from '@cngx/ui/paginator';
