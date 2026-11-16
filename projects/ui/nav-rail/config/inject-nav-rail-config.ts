import { inject } from '@angular/core';

import type { CngxNavRailConfig } from './nav-rail.config';
import { CNGX_NAV_RAIL_CONFIG, CNGX_NAV_RAIL_DEFAULTS } from './nav-rail.config.defaults';

/**
 * The nav rail configuration in scope (`provideNavRailConfigAt` ->
 * `provideNavRailConfig` -> library defaults), with every key resolved: a key
 * the value in scope leaves out (a hand-written `CNGX_NAV_RAIL_CONFIG`
 * provider) falls back to the library default, so a caller in another entry
 * never repeats a default. Runs in injection context.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/nav-rail/config/inject-nav-rail-config.ts
 * @since 0.3.0
 * @relatedTo CNGX_NAV_RAIL_CONFIG, provideNavRailConfig
 */
export function injectNavRailConfig(): Required<CngxNavRailConfig> {
  // Key by key, not a spread: the feature reducer writes unset keys as
  // `undefined`, which a spread would copy over the default.
  const scoped = inject(CNGX_NAV_RAIL_CONFIG);
  return {
    labelPlacement: scoped.labelPlacement ?? CNGX_NAV_RAIL_DEFAULTS.labelPlacement,
    side: scoped.side ?? CNGX_NAV_RAIL_DEFAULTS.side,
    tooltip: scoped.tooltip ?? CNGX_NAV_RAIL_DEFAULTS.tooltip,
    tooltipDelay: scoped.tooltipDelay ?? CNGX_NAV_RAIL_DEFAULTS.tooltipDelay,
  };
}
