/**
 * @module @cngx/common/data
 */
export { CngxSort, type SortEntry } from './sort/sort.directive';
export { CngxSortHeader } from './sort/sort-header.directive';
export { CngxFilter } from './filter/filter.directive';
export {
  CngxFilterChips,
  CngxFilterChip,
  type CngxFilterChipContext,
} from './filter-chips/filter-chips.component';
export { CngxPaginate } from './paginate/paginate.directive';
export { CngxDataSource, injectDataSource } from './data-source/data-source';
export {
  CngxSmartDataSource,
  injectSmartDataSource,
  type CngxSmartDataSourceOptions,
} from './data-source/smart-data-source';

// Re-export the curated async-state sub-barrel wholesale so additions there
// (e.g. fromResource / fromHttpResource / tapAsyncState) cannot silently drop
// out of `@cngx/common/data`.
export * from './async-state';

export { CngxAsync, type CngxAsyncContext } from './async/async.directive';

export { CngxMetric } from './display/metric/metric.component';
export { CngxTrend } from './display/trend/trend.component';

export {
  injectRecycler,
  provideRecyclerI18n,
  CNGX_RECYCLER_I18N,
  type RecyclerConfig,
  type CngxRecycler,
  type RecyclerI18n,
} from './recycler/recycler';
export { CngxMeasure } from './recycler/measure.directive';
export { CngxVirtualItem } from './recycler/virtual-item.directive';
export { CngxRecyclerAnnouncer } from './recycler/recycler-announcer.component';
export { connectRecyclerToRoving } from './recycler/connect-recycler-roving';
export { connectRecyclerToActiveDescendant } from './recycler/connect-recycler-active-descendant';

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
} from './commit';

// Material bidirectional sync — shared factory consumed by cngx
// organisms / directives that bridge a cngx presenter against a
// Material parent (`<mat-tab-group>`, `<mat-stepper>`, etc.).
// Material types never enter the signature; the caller maps at the
// directive boundary so `@cngx/common/data` stays Sheriff-Level-2
// compliant (no `@angular/material` import).
export {
  createMaterialBidirectionalSync,
  type CngxMaterialBidirectionalSyncOptions,
  type CngxMaterialBidirectionalSyncHandle,
} from './material-bridge/bidirectional-sync';
