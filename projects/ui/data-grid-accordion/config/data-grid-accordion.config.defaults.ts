import { inject, InjectionToken, type Signal } from '@angular/core';
import { createOverrideMerge } from '@cngx/core/utils';

import type {
  CngxDataGridAccordionConfig,
  CngxDataGridAccordionLabels,
} from './data-grid-accordion.config';

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
 * @since 0.1.0
 */
export const CNGX_DATA_GRID_ACCORDION_CONFIG = new InjectionToken<CngxDataGridAccordionConfig>(
  'CNGX_DATA_GRID_ACCORDION_CONFIG',
  {
    providedIn: 'root',
    factory: () => CNGX_DATA_GRID_ACCORDION_DEFAULTS,
  },
);

/**
 * @internal - English copy of the data-grid-accordion family. Each sort status
 * describes the primary (non-additive) click outcome, so a screen reader hears
 * both the current sort and what activating does.
 */
export const CNGX_DATA_GRID_ACCORDION_LABELS_DEFAULTS: CngxDataGridAccordionLabels = {
  count: (count) => `${count} ${count === 1 ? 'result' : 'results'}`,
  countSingular: 'result',
  countPlural: 'results',
  sortNone: 'not sorted, activate to sort ascending',
  sortAscending: 'sorted ascending, activate to sort descending',
  sortDescending: 'sorted descending, activate to sort ascending',
  sortAnnouncedAscending: 'Sorted by {label} ascending',
  sortAnnouncedDescending: 'Sorted by {label} descending',
  sortAnnouncedCleared: 'Sorting by {label} cleared',
  filter: 'Filter',
  filterRows: 'Filter rows',
  rowLoadFailed: 'Failed to load',
  note: 'NOTE',
};

/**
 * @internal - the resolved labels bundle. One shared `computed()` per config
 * object, so row-level parts allocate nothing after the first.
 */
export function injectDataGridAccordionLabels(): Signal<CngxDataGridAccordionLabels> {
  return createOverrideMerge(
    CNGX_DATA_GRID_ACCORDION_LABELS_DEFAULTS,
    inject(CNGX_DATA_GRID_ACCORDION_CONFIG).labels,
  );
}
