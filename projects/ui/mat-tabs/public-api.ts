/**
 * @module @cngx/ui/mat-tabs
 *
 * Material instrumentation directive for `<mat-tab-group>`.
 */
export { CngxMatTabs } from './mat-tabs.directive';
export { CngxMatTabNav } from './mat-tab-nav.directive';
export { CngxMatTabLink } from './mat-tab-link.directive';
export { CngxMatTabError } from './mat-tab-error.directive';
export { CngxMatTabErrorFlag } from './mat-tab-error-flag.directive';
export {
  CNGX_MAT_TABS_REGISTRY_HOST,
  CngxMatTabsRegistry,
  type CngxMatTabsRegistryHost,
} from './mat-tabs-registry.directive';
export {
  CngxMatTabAggregatorContent,
  type CngxMatTabAggregatorContentContext,
} from './decorations/mat-tab-aggregator-content.directive';
export {
  CngxMatTabRejectionContent,
  type CngxMatTabRejectionContentContext,
} from './decorations/mat-tab-rejection-content.directive';
export type { CngxMatTabHalfWiredSlotSink } from './decorations/half-wired-slot-sink';
export {
  CNGX_MAT_TABS_CONFIG,
  type CngxMatTabsConfig,
  type CngxMatTabsConfigFeature,
  type CngxMatTabsTemplates,
  injectMatTabsConfig,
  provideMatTabsConfig,
  provideMatTabsConfigAt,
  withAnchorRetryAttempts,
  withHalfWiredSlotSink,
  withMatTabRejectionTemplate,
} from './mat-tabs-config';
export {
  CNGX_MAT_TAB_HANDLE_FACTORY,
  createMatTabHandle,
  type CngxMatTabHandleFactory,
} from './material-bridge/handle';
export { MaterialPrivateSurfaces } from './material-bridge/private-surfaces';
// Cross-entry internal surface: consumed by @cngx/ui/mat-stepper, same
// pattern as MaterialPrivateSurfaces above. All @internal-tagged.
export {
  createOrderedRegistrationSeam,
  type CngxOrderedRegistrationSeam,
  type CngxOrderedRegistrationSeamOptions,
} from './material-bridge/ordered-registration';
export {
  mountLiveRegionAnnouncer,
  type CngxMatBridgeLiveRegionOptions,
} from './material-bridge/live-region';
export { createCngxMatTabOverflowDomAdapter } from './overflow/mat-tab-overflow-dom-adapter';
