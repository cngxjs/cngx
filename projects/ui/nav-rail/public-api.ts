/**
 * @module @cngx/ui/nav-rail
 */

export { injectNavRailTooltip } from './nav-rail-tooltip';
export { injectNavRailFlyout, type CngxNavRailFlyoutSources } from './nav-rail-flyout';
export { CngxNavRail, type CngxNavRailLabelPlacement } from './nav-rail';
export {
  CNGX_NAV_RAIL_I18N,
  type CngxNavRailI18n,
  type CngxNavRailI18nFeature,
  injectNavRailI18n,
  provideNavRailI18n,
  withNavRailI18nLabels,
} from './nav-rail-i18n';
export {
  CNGX_NAV_RAIL_LANGUAGE_EN,
  type CngxNavRailLanguageSection,
} from './i18n/nav-rail-language-section';
