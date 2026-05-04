/**
 * @module @cngx/common/data
 */
export { CngxSort, type SortEntry } from './src/sort/sort.directive';
export { CngxSortHeader } from './src/sort/sort-header.directive';
export { CngxFilter } from './src/filter/filter.directive';
export {
  CngxFilterChips,
  CngxFilterChip,
  type CngxFilterChipContext,
} from './src/filter-chips/filter-chips.component';
export { CngxPaginate } from './src/paginate/paginate.directive';
export { CngxDataSource, injectDataSource } from './src/data-source/data-source';
export {
  CngxSmartDataSource,
  injectSmartDataSource,
  type CngxSmartDataSourceOptions,
} from './src/data-source/smart-data-source';

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
export { CngxAsync, type CngxAsyncContext } from './src/async/async.directive';

// Display atoms
export { CngxMetric } from './src/display/metric.component';
export { CngxTrend } from './src/display/trend.component';

// Recycler
export {
  injectRecycler,
  provideRecyclerI18n,
  CNGX_RECYCLER_I18N,
  type RecyclerConfig,
  type CngxRecycler,
  type RecyclerI18n,
} from './src/recycler/recycler';
export { CngxMeasure } from './src/recycler/measure.directive';
export { CngxVirtualItem } from './src/recycler/virtual-item.directive';
export { CngxRecyclerAnnouncer } from './src/recycler/recycler-announcer.component';
export { connectRecyclerToRoving } from './src/recycler/connect-recycler-roving';
export { connectRecyclerToActiveDescendant } from './src/recycler/connect-recycler-active-descendant';

// Commit controller — generic async-commit state machine shared by
// the select family and the stepper / wizard family.
export {
  createCommitController,
  type CngxCommitController,
  type CngxCommitBeginHandlers,
  type CngxCommitHandle,
  type CngxCommitRunner,
  CNGX_COMMIT_CONTROLLER_FACTORY,
  type CngxCommitControllerFactory,
} from './src/commit';
