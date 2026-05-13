import { InjectionToken } from '@angular/core';

import { CNGX_FILTER_BUILDER_DEFAULTS, type CngxFilterEditor } from './filter-builder.config';

/**
 * Dedicated DI token for the editor registry. Resolves to the same shape
 * as `CNGX_FILTER_BUILDER_CONFIG.editors` but is provided independently so
 * consumers who only need to swap one editor (typical: feed a richer
 * `string` input from `@cngx/forms/input`) do not have to thread the full
 * config object.
 *
 * Default factory clones the frozen `CNGX_FILTER_BUILDER_DEFAULTS.editors`
 * map — single source of truth for the four builtin entries.
 *
 * Resolution priority for the filter-builder component (Phase 5):
 * 1. `CNGX_FILTER_BUILDER_CONFIG.editors` when the config was provided
 *    via `provideFilterBuilderConfig(withEditors({...}))`.
 * 2. `CNGX_FILTER_EDITORS` when provided independently via
 *    `providers: [{ provide: CNGX_FILTER_EDITORS, useValue: ... }]`.
 * 3. The default map below.
 */
export const CNGX_FILTER_EDITORS = new InjectionToken<ReadonlyMap<string, CngxFilterEditor>>(
  'CngxFilterEditors',
  {
    providedIn: 'root',
    factory: () => new Map(CNGX_FILTER_BUILDER_DEFAULTS.editors),
  },
);
