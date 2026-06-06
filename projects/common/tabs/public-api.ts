/**
 * @module @cngx/common/tabs
 */
export {
  CngxTabGroupPresenter,
  type CngxTabsCommitAction,
} from './presenter.directive';
export {
  CNGX_TAB_GROUP_HOST,
  type CngxTabGroupHost,
  type CngxTabHandle,
} from './tab-group-host.token';
export {
  CNGX_TAB_PANEL_HOST,
  type CngxTabPanelHost,
} from './tab-panel-host.token';
export { CngxTab } from './tab.directive';
export { CngxTabLabel } from './tab-label.directive';
export { CngxTabContent } from './tab-content.directive';
export { CngxTabsFragmentSync } from './router-sync.directive';
export {
  CNGX_TABS_CONFIG,
  injectTabsConfig,
  provideTabsConfig,
  provideTabsConfigAt,
  withDefaultOrientation,
  withTabBusySpinnerTemplate,
  withTabErrorBadgeTemplate,
  withTabIconTemplate,
  withTabOverflowItemTemplate,
  withTabOverflowMaxDeferMs,
  withTabOverflowStabilizeMs,
  withTabOverflowTriggerTemplate,
  withTabRejectionIconTemplate,
  withTabsAriaLabels,
  withTabsCommitMode,
  withTabsDefaultOrientation,
  withTabsFallbackLabels,
  withTabsIconLayout,
  withTabsRouterSync,
  withTabsRovingLoop,
  withTabsSkin,
  type CngxTabIconLayout,
  type CngxTabsAriaLabels,
  type CngxTabsConfig,
  type CngxTabsConfigFeature,
  type CngxTabsFallbackLabels,
  type CngxTabsSkin,
  type CngxTabsTemplates,
} from './tabs-config';
// This block ships `@internal` factory helpers. They are exported
// through `public-api.ts` so the sibling `@cngx/ui/tabs` organism can
// consume them across the secondary-entry boundary (ng-packagr has no
// cross-entry private surface). `disableInternal: true` hides them from
// generated docs; the LLM-md export honours the same tag. Precedent:
// `CNGX_TABS_GLYPHS`, `tabsEqual`.
export {
  createTabsHostAttrs,
  type CngxTabsHostAttrs,
  type CngxTabsHostAttrsInputs,
} from './tabs-host-attrs';
export {
  provideCngxTabs,
  provideCngxTabsAt,
  type CngxTabsFeature,
} from './provide-cngx-tabs';
export {
  CNGX_TABS_I18N,
  injectTabsI18n,
  provideTabsI18n,
  withTabsI18nLabels,
  type CngxTabsI18n,
  type CngxTabsI18nFeature,
} from './i18n/tabs-i18n';
export {
  createTabsCommitHandler,
  CNGX_TABS_COMMIT_HANDLER_FACTORY,
  type CngxTabsCommitHandler,
  type CngxTabsCommitHandlerFactory,
  type CngxTabsCommitHandlerOptions,
} from './commit-handler';
export {
  CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY,
  createCngxTabOverflowDefaultDomAdapter,
  type CngxTabOverflowDomAdapter,
  type CngxTabOverflowDomAdapterFactory,
} from './overflow/dom-adapter';
export {
  CNGX_DOM_ANCHOR_RETRY_FACTORY,
  createDomAnchorRetry,
  type CngxDomAnchorRetryFactory,
  type CngxDomAnchorRetryHandle,
  type CngxDomAnchorRetryOptions,
  type CngxDomAnchorRetryResult,
} from './overflow/dom-anchor-retry';
export {
  CngxTabOverflowTrigger,
  type CngxTabOverflowTriggerContext,
} from './overflow/tab-overflow-trigger.directive';
export {
  CngxTabOverflowItem,
  type CngxTabOverflowItemContext,
} from './overflow/tab-overflow-item.directive';
export {
  CngxTabErrorBadge,
  type CngxTabErrorBadgeContext,
} from './slots/tab-error-badge.directive';
export {
  CngxTabRejectionIcon,
  type CngxTabRejectionIconContext,
} from './slots/tab-rejection-icon.directive';
export {
  CngxTabBusySpinner,
  type CngxTabBusySpinnerContext,
} from './slots/tab-busy-spinner.directive';
export {
  CngxTabIcon,
  type CngxTabIconContext,
} from './slots/tab-icon.directive';
export {
  createTabGroupTemplateBindings,
  type CngxTabGroupTemplateBindings,
  type CngxTabGroupTemplateBindingsOptions,
} from './slots/tab-group-template-cascade';
export {
  createTabGroupAnnouncements,
  type CngxTabGroupAnnouncements,
  type CngxTabGroupAnnouncementsOptions,
} from './announcements/tab-group-announcements';
export { CNGX_TABS_GLYPHS } from './glyphs';
export {
  CNGX_OVERFLOW_POPOVER_HIGHLIGHT_FACTORY,
  createOverflowPopoverHighlightSync,
  createTabOverflowTemplateBindings,
  tabOverflowOptionId,
  type CngxOverflowPopoverHighlightSyncFactory,
  type CngxTabOverflowTemplateBindings,
  type CngxTabOverflowTemplateBindingsOptions,
} from './overflow/overflow-template-cascade';

export {
  CNGX_ORGANISM_SCROLL_SYNC_FACTORY,
  createOrganismScrollSync,
  type CngxOrganismScrollSyncFactory,
  type CngxOrganismScrollSyncOptions,
} from './scroll-sync/organism-scroll-sync';
export {
  CNGX_DIRECTIVE_BY_ID_MAP_FACTORY,
  createDirectiveByIdMap,
  type CngxDirectiveByIdMapFactory,
  type CngxDirectiveByIdMapOptions,
} from './registry/directive-by-id-map';
