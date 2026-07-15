/**
 * @module @cngx/ui/sidenav
 */

export { CngxSidenavLayout } from './sidenav-layout';
export { CngxSidenav, type SidenavPosition, type SidenavMode } from './sidenav';
export { CngxSidenavContent } from './sidenav-content';
export { CngxSidenavHeader } from './sidenav-header';
export { CngxSidenavFooter } from './sidenav-footer';

export type { CngxSidenavConfig } from './config/sidenav.config';
export { CNGX_SIDENAV_CONFIG } from './config/sidenav.config.defaults';
export {
  provideSidenavConfig,
  provideSidenavConfigAt,
  type CngxSidenavConfigFeature,
} from './config/provide-sidenav-config';
export {
  withSidenavDimensions,
  withSidenavResponsive,
  withSidenavShortcut,
  withSidenavHoverDwell,
} from './config/features';
export { injectSidenavConfig } from './config/inject-sidenav-config';
