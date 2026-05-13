import { inject, InjectionToken } from '@angular/core';

import {
  CNGX_FILTER_BUILDER_DEFAULTS,
  injectFilterBuilderConfig,
  type CngxFilterEditor,
} from './filter-builder.config';

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

/**
 * Resolve the editor registry through the documented 3-stage cascade:
 *
 * 1. `CNGX_FILTER_BUILDER_CONFIG.editors` when the consumer provided the
 *    config via `provideFilterBuilderConfig(withEditors({...}))` (detected
 *    by reference inequality with `CNGX_FILTER_BUILDER_DEFAULTS.editors` —
 *    `withEditors` always allocates a fresh Map).
 * 2. `CNGX_FILTER_EDITORS` when provided independently via a token
 *    `useValue` override.
 * 3. The token's `providedIn: 'root'` default factory (clone of
 *    `CNGX_FILTER_BUILDER_DEFAULTS.editors`).
 *
 * Phase 5's `<cngx-filter-builder>` component should read editors through
 * this helper rather than reaching into either source directly — single
 * resolution path keeps the dedicated `CNGX_FILTER_EDITORS` token alive
 * for consumers who skip the full config.
 */
export function injectFilterEditors(): ReadonlyMap<string, CngxFilterEditor> {
  const config = injectFilterBuilderConfig();
  if (config.editors !== CNGX_FILTER_BUILDER_DEFAULTS.editors) {
    return config.editors;
  }
  return inject(CNGX_FILTER_EDITORS);
}
