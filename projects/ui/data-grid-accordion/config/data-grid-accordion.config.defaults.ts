import { InjectionToken } from '@angular/core';

import type { CngxDataGridAccordionConfig } from './data-grid-accordion.config';

/**
 * Library defaults for the data-grid-accordion configuration cascade. The base
 * default leaves `skin` unset (the flat grid look); consumers move the default
 * via {@link withDataGridSkin}.
 *
 * Exported for intra-lib consumers (`provideDataGridAccordionConfig` merges with
 * this base) but **NOT** re-exported from `public-api.ts` - downstream consumers
 * reach the defaults via `inject(CNGX_DATA_GRID_ACCORDION_CONFIG)` so
 * `provideDataGridAccordionConfig` / `provideDataGridAccordionConfigAt` overrides
 * take precedence.
 *
 * @internal
 */
export const CNGX_DATA_GRID_ACCORDION_DEFAULTS: CngxDataGridAccordionConfig = {};

/**
 * App-wide configuration cascade for the data-grid-accordion organism. Resolves
 * in priority order:
 *
 *   1. Per-instance `[skin]` Input binding.
 *   2. `provideDataGridAccordionConfigAt(...)` in a parent component's
 *      `viewProviders`.
 *   3. `provideDataGridAccordionConfig(...)` at the application root.
 *   4. Library default (this token's `factory`).
 *
 * `providedIn: 'root'` with a default factory means consumers never need to
 * provide the token explicitly - `inject(CNGX_DATA_GRID_ACCORDION_CONFIG)` always
 * resolves.
 *
 * @category ui/data-grid-accordion
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/data-grid-accordion/config/data-grid-accordion.config.defaults.ts
 * @since 0.1.0
 */
export const CNGX_DATA_GRID_ACCORDION_CONFIG = new InjectionToken<CngxDataGridAccordionConfig>(
  'CNGX_DATA_GRID_ACCORDION_CONFIG',
  {
    providedIn: 'root',
    factory: () => CNGX_DATA_GRID_ACCORDION_DEFAULTS,
  },
);
