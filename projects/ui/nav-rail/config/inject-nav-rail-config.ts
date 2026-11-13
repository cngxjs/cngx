import { inject } from '@angular/core';

import type { CngxNavRailConfig } from './nav-rail.config';
import { CNGX_NAV_RAIL_CONFIG } from './nav-rail.config.defaults';

/**
 * The nav rail configuration in scope (`provideNavRailConfigAt` ->
 * `provideNavRailConfig` -> library defaults). Runs in injection context;
 * equivalent to `inject(CNGX_NAV_RAIL_CONFIG)`.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/nav-rail/config/inject-nav-rail-config.ts
 * @since 0.3.0
 * @relatedTo CNGX_NAV_RAIL_CONFIG, provideNavRailConfig
 */
export function injectNavRailConfig(): CngxNavRailConfig {
  return inject(CNGX_NAV_RAIL_CONFIG);
}
