/**
 * @module @cngx/common/data
 */
export { CngxSort, type SortEntry } from './src/sort.directive';
export { CngxSortHeader } from './src/sort-header.directive';
export { CngxFilter } from './src/filter.directive';
export { CngxPaginate } from './src/paginate.directive';
export { CngxDataSource, injectDataSource } from './src/data-source';
export {
  CngxSmartDataSource,
  injectSmartDataSource,
  type CngxSmartDataSourceOptions,
} from './src/smart-data-source';

// Async state
export {
  createManualState,
  type ManualAsyncState,
  createAsyncState,
  type MutableAsyncState,
  injectAsyncState,
  type ReactiveAsyncState,
  type InjectAsyncStateOptions,
  resolveAsyncView,
  type AsyncView,
} from './src/async-state';

// Async structural directive
export { CngxAsync, type CngxAsyncContext } from './src/async.directive';

// Display atoms
export { CngxMetric } from './src/metric.component';
export { CngxTrend } from './src/trend.component';
