import { inject } from '@angular/core';

import type { CngxDataGridAccordionConfig } from './data-grid-accordion.config';
import { CNGX_DATA_GRID_ACCORDION_CONFIG } from './data-grid-accordion.config.defaults';

/**
 * Convenience accessor for the data-grid-accordion configuration cascade. Runs in
 * injection context; resolves through the priority chain (per-instance Input
 * -> `provideDataGridAccordionConfigAt` -> `provideDataGridAccordionConfig` ->
 * library defaults). Equivalent to `inject(CNGX_DATA_GRID_ACCORDION_CONFIG)` -
 * the helper exists so consumers don't import the token directly. Mirrors
 * `injectAccordionConfig` in `@cngx/ui/accordion`.
 *
 * ```ts
 * export class CngxDataGridAccordion {
 *   private readonly config = injectDataGridAccordionConfig();
 *   readonly skin = input<CngxDataGridSkin | undefined>(undefined);
 * }
 * ```
 *
 * @category ui/data-grid-accordion
 * @since 0.1.0
 */
export function injectDataGridAccordionConfig(): CngxDataGridAccordionConfig {
  return inject(CNGX_DATA_GRID_ACCORDION_CONFIG);
}
