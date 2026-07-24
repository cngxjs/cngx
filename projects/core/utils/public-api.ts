/**
 * @module @cngx/core/utils
 */
export { coerceBooleanProperty, coerceNumberProperty } from './coerce.util';
export { memoize } from './memo.util';
export { parseKeyCombo, matchesKeyCombo, type KeyCombo } from './keyboard.util';
export { hasTransition, onTransitionDone } from './transition.util';
export { nextUid } from './uid.util';
export { type AsyncStatus, type CngxAsyncState } from './async-state';
export {
  buildAsyncStateView,
  type AsyncStateViewSources,
} from './build-async-state-view';
export { createTransitionTracker, type StatusTransition } from './transition-tracker';
export { createVisibilityGate } from './visibility-gate';
export { createLatencyProbe, type CngxLatencyProbe } from './latency-probe';
export {
  type CngxLoadingConfig,
  type CngxLoadingConfigFeature,
  CNGX_LOADING_DEFAULTS,
  CNGX_LOADING_CONFIG,
  withShowDelay,
  withMinDwell,
  withSpinnerVsSkeletonCutoff,
  provideLoadingConfig,
  provideLoadingConfigAt,
  injectLoadingConfig,
} from './loading-config';
export { createControlledSource } from './controlled-source';
export { CNGX_STATEFUL, type CngxStateful } from './stateful';
export {
  CNGX_SELECTION_CONTROLLER_FACTORY,
  createSelectionController,
  type CngxSelectionControllerFactory,
  type SelectionController,
  type SelectionControllerOptions,
} from './selection-controller';
