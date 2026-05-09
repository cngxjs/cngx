/**
 * @module @cngx/ui/mat-tabs
 *
 * Material instrumentation directive for `<mat-tab-group>`.
 */
export { CngxMatTabs } from './src/mat-tabs.directive';
export { CngxMatTabError } from './src/mat-tab-error.directive';
export {
  CngxMatTabAggregatorContent,
  type CngxMatTabAggregatorContentContext,
} from './src/decorations/mat-tab-aggregator-content.directive';
export {
  CngxMatTabRejectionContent,
  type CngxMatTabRejectionContentContext,
} from './src/decorations/mat-tab-rejection-content.directive';
export type { CngxMatTabHalfWiredSlotSink } from './src/decorations/half-wired-slot-sink';
export {
  CNGX_MAT_TABS_CONFIG,
  type CngxMatTabsConfig,
  type CngxMatTabsConfigFeature,
  injectMatTabsConfig,
  provideMatTabsConfig,
  provideMatTabsConfigAt,
  withAnchorRetryAttempts,
  withHalfWiredSlotSink,
} from './src/mat-tabs-config';
export {
  CNGX_MAT_TAB_HANDLE_FACTORY,
  createMatTabHandle,
  type CngxMatTabHandleFactory,
} from './src/material-bridge/handle';
export { createCngxMatTabOverflowDomAdapter } from './src/overflow/mat-tab-overflow-dom-adapter';
