/**
 * @module @cngx/ui/nav-rail
 */

export {
  CNGX_NAV_RAIL_TOOLTIP_FACTORY,
  type CngxNavRailTooltipFactory,
  type CngxNavRailTooltipSources,
  injectNavRailTooltip,
} from './nav-rail-tooltip';
export {
  CNGX_NAV_RAIL_FLYOUT_FACTORY,
  type CngxNavRailFlyoutFactory,
  type CngxNavRailFlyoutSources,
  injectNavRailFlyout,
} from './nav-rail-flyout';
export { CngxNavRail, type CngxNavRailLabelPlacement, type CngxNavRailSide } from './nav-rail';
export type { CngxNavRailConfig } from './config/nav-rail.config';
export { CNGX_NAV_RAIL_CONFIG } from './config/nav-rail.config.defaults';
export {
  provideNavRailConfig,
  provideNavRailConfigAt,
  type CngxNavRailConfigFeature,
} from './config/provide-nav-rail-config';
export {
  withNavRailLabelPlacement,
  withNavRailSide,
  withNavRailTooltip,
  withNavRailTooltipDelay,
} from './config/features';
export { injectNavRailConfig } from './config/inject-nav-rail-config';
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
