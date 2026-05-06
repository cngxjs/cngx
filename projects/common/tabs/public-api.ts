/**
 * @module @cngx/common/tabs
 */
export {
  CngxTabGroupPresenter,
  type CngxTabsCommitAction,
} from './src/presenter.directive';
export {
  CNGX_TAB_GROUP_HOST,
  type CngxTabGroupHost,
  type CngxTabHandle,
} from './src/tab-group-host.token';
export {
  CNGX_TAB_PANEL_HOST,
  type CngxTabPanelHost,
} from './src/tab-panel-host.token';
export { CngxTab } from './src/tab.directive';
export { CngxTabLabel } from './src/tab-label.directive';
export { CngxTabContent } from './src/tab-content.directive';
export { CngxTabsFragmentSync } from './src/router-sync.directive';
export {
  CNGX_TABS_CONFIG,
  injectTabsConfig,
  provideTabsConfig,
  provideTabsConfigAt,
  withDefaultOrientation,
  withTabsRovingLoop,
  withTabsCommitMode,
  withTabsRouterSync,
  withTabsAriaLabels,
  withTabsFallbackLabels,
  type CngxTabsConfig,
  type CngxTabsConfigFeature,
  type CngxTabsAriaLabels,
  type CngxTabsFallbackLabels,
} from './src/tabs-config';
export {
  CNGX_TABS_I18N,
  injectTabsI18n,
  provideTabsI18n,
  type CngxTabsI18n,
} from './src/i18n/tabs-i18n';
export {
  createTabsCommitHandler,
  CNGX_TABS_COMMIT_HANDLER_FACTORY,
  type CngxTabsCommitHandler,
  type CngxTabsCommitHandlerFactory,
  type CngxTabsCommitHandlerOptions,
} from './src/commit-handler';

// Organism helpers — extracted from the Level-4 organism shells so
// the same shape can be reused (`<cngx-tab-group>` today; future
// `<cngx-stepper>` / `<cngx-mat-stepper>` if they grow scrolling
// strips). Behaviour-preserving extraction; not a public-consumer API
// surface, but exported because the schematic decompose target
// flattens these helpers into the consumer's project.
export {
  createOrganismScrollSync,
  type CngxOrganismScrollSyncOptions,
} from './src/scroll-sync/organism-scroll-sync';
