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
  CNGX_MAT_TAB_HALF_WIRED_SLOT_SINK,
  type CngxMatTabHalfWiredSlotSink,
} from './src/decorations/half-wired-slot-sink';
export { CNGX_MAT_TABS_ANCHOR_MAX_ATTEMPTS } from './src/anchor-retry-config';
export { createMatTabHandle } from './src/material-bridge/handle';
export { createCngxMatTabOverflowDomAdapter } from './src/overflow/mat-tab-overflow-dom-adapter';
