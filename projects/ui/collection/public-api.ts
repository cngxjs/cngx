/**
 * @module @cngx/ui/collection
 */

export { CngxIncrementalList } from './incremental-list.component';
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
  injectIncrementalListConfig,
  withIncrementalListAriaLabels,
  withIncrementalListTemplates,
  type CngxIncrementalListConfig,
  type CngxIncrementalListConfigFeature,
  type CngxIncrementalListAriaLabels,
  type CngxIncrementalListTemplates,
} from './incremental-list-config';
