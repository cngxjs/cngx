/**
 * @module @cngx/common/data
 */
export { CngxSort, type SortEntry } from './sort/sort.directive';
export { CngxSortHeader } from './sort/sort-header.directive';
export { createSortHeaderState, type SortHeaderState } from './sort/sort-header-state';
export { CngxFilter } from './filter/filter.directive';
export {
  CngxFilterChips,
  CngxFilterChip,
  type CngxFilterChipContext,
} from './filter-chips/filter-chips.component';
export { CngxPaginate } from './paginate/paginate.directive';
export { CngxPaginateResetOn, connectPaginateResetOn } from './paginate/paginate-reset.directive';
export { connectPaginateEmit, type CngxPaginateEmitHandlers } from './paginate/paginate-emit';
export { CngxPaginateRouting } from './paginate/paginate-routing.directive';
export { CngxBucketPaginate, type CngxBucket } from './paginate/bucket-paginate.directive';
export {
  CNGX_BUCKET_PAGINATE_HOST,
  type CngxBucketPaginateHost,
  type CngxBucketPaginateView,
} from './paginate/bucket-paginate-host.token';
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

export { CngxAsyncRegistry, type CngxAsyncOperation } from './async-registry/async-registry';
export { provideAsyncRegistry, injectAsyncRegistry } from './async-registry/provide-async-registry';

export { CngxAsync, type CngxAsyncContext } from './async/async.directive';

export { CngxMetric } from './display/metric/metric.component';
export { CngxTrend } from './display/trend/trend.component';
export { CngxDelta } from './display/delta/delta.component';
export { type DeltaPolarity, type DeltaMode } from './display/shared/delta-format';
export { CngxStat } from './display/stat/stat.component';
export {
  CngxStatLabel,
  CngxStatValue,
  CngxStatDelta,
  CngxStatCaption,
} from './display/stat/stat-slots';
export { CNGX_STAT, type CngxStatRegistry, type CngxStatSlotKind } from './display/stat/stat.token';
export { CngxStatus, type StatusTone } from './display/status/status.component';
export { CngxGoal } from './display/goal/goal.component';

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
