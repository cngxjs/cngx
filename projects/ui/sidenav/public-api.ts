/**
 * @module `@cngx/ui/sidenav`
 */

export { CngxSidenavLayout } from './sidenav-layout';
export {
  CngxSidenav,
  type SidenavPosition,
  type SidenavMode,
  type ResolvedSidenavMode,
} from './sidenav';
export { CNGX_SIDENAV, type CngxSidenavContract } from './sidenav-token';
export {
  CNGX_SIDENAV_ANNOUNCER_FACTORY,
  type CngxSidenavAnnouncer,
  type CngxSidenavAnnouncerFactory,
  createSidenavAnnouncer,
} from './sidenav-announcer';
export { CngxSidenavRouterSync } from './sidenav-router-sync.directive';
export { CngxSidenavContent } from './sidenav-content';

export type { CngxSidenavConfig, CngxSidenavLabels } from './config/sidenav.config';
export {
  CNGX_SIDENAV_CONFIG,
  CNGX_SIDENAV_DEFAULTS,
  CNGX_SIDENAV_STORAGE,
} from './config/sidenav.config.defaults';
export {
  provideSidenavConfig,
  provideSidenavConfigAt,
  type CngxSidenavConfigFeature,
} from './config/provide-sidenav-config';
export {
  withSidenavDimensions,
  withSidenavShortcut,
  withSidenavHoverDwell,
  withSidenavRouterSync,
  withSidenavLabels,
  withSidenavPersistence,
} from './config/features';
export { injectSidenavConfig, injectSidenavLabels } from './config/inject-sidenav-config';
export {
  CNGX_SIDENAV_LANGUAGE_EN,
  type CngxSidenavLanguageSection,
} from './i18n/sidenav-language-section';
