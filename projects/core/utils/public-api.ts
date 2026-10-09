/**
 * @module @cngx/core/utils
 */
export { coerceBooleanProperty, coerceNumberProperty, coerceSignal } from './coerce.util';
export {
  createDefaultsFill,
  createFilledOverrideMerge,
  createNestedOverrideMerge,
  createOverrideMerge,
  type CngxNestedOverrides,
} from './override-merge';
export { memoize, type MemoizeOptions } from './memo.util';
export {
  dateTimeFormatterFor,
  displayFormattersFor,
  formatDisplayValue,
  numberFormatterFor,
  type CngxDisplayFormatters,
} from './intl-format.util';
export { CNGX_LOCALE, injectLocale, provideLocale, provideLocaleAt } from './locale';
export { parseKeyCombo, matchesKeyCombo, type KeyCombo } from './keyboard.util';
export {
  createLabelMatcher,
  createTypeaheadMatcher,
  foldForMatching,
  matchesTypeahead,
} from './typeahead.util';
export { hasTransition, onTransitionDone, type TransitionDoneHandle } from './transition.util';
export { nextUid } from './uid.util';
export { type AsyncStatus, type CngxAsyncState } from './async-state';
export { buildAsyncStateView, type AsyncStateViewSources } from './build-async-state-view';
export { createAggregateAsyncState } from './aggregate-async-state';
export { createAnnouncementPhrase, type AnnouncementPhraseOptions } from './announcement-phrase';
export {
  createTransitionTracker,
  type StatusTransition,
  type TransitionTrackerOptions,
  type ValueTransition,
} from './transition-tracker';
export { createVisibilityGate } from './visibility-gate';
export { createLatencyProbe, type CngxLatencyProbe } from './latency-probe';
export {
  type CngxLoadingConfig,
  type CngxLoadingConfigFeature,
  type CngxLoadingTreatment,
  resolveLoadingTreatment,
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
export {
  createMediaQuerySignal,
  observeMediaQuery,
  type MediaQueryHost,
} from './media-query-signal';
export {
  createKeyedRegistry,
  createSlotRegistry,
  type KeyedRegistry,
  type RegistryOptions,
  type SlotRegistry,
} from './registry';
export { CNGX_STATEFUL, type CngxStateful } from './stateful';
export {
  CNGX_SELECTION_CONTROLLER_FACTORY,
  createSelectionController,
  type CngxSelectionControllerFactory,
  type SelectionController,
  type SelectionControllerOptions,
} from './selection-controller';
// This block ships `@internal` dev-mode diagnostics. They are exported
// through `public-api.ts` so the devtools and testing entries of other
// libraries can read them across the secondary-entry boundary (ng-packagr has
// no cross-entry private surface). Each declaration carries its own
// `@internal` tag, which hides it from generated docs and the LLM-md export.
// Precedent: `@cngx/common/tabs` factory helpers.
export {
  CNGX_DEV_DESCRIPTOR_VERSION,
  CNGX_DEV_DESCRIPTORS,
  resolveControlledProvenance,
  resolveDevDescriptors,
  resolveOverrideProvenance,
  type CngxControlledProvenance,
  type CngxControlledSourceDescriptor,
  type CngxDefaultsFillDescriptor,
  type CngxDevDescriptor,
  type CngxDevDescriptorEntry,
  type CngxDevDescriptorInit,
  type CngxFactoryDescriptor,
  type CngxNestedOverrideMergeDescriptor,
  type CngxOverrideMergeDescriptor,
  type CngxOverrideProvenance,
  type CngxValueSource,
} from './dev-descriptors';
export {
  createAnnouncementRecorder,
  type CngxAnnouncementOrigin,
  type CngxAnnouncementRecorder,
  type CngxAnnouncementRecorderOptions,
  type CngxAnnouncementSuppression,
  type CngxRecordedAnnouncement,
} from './announcement-recorder';
