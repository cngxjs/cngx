import { InjectionToken, type Signal } from '@angular/core';

/**
 * UI-local context a {@link CngxDataGridAccordion} exposes so each
 * {@link CngxDataGridRow} reads the shared heading level without injecting the
 * concrete group class (cyclic type, blocks Atomic Decompose). Kept separate from
 * the headless `CNGX_ACCORDION` brain contract, which stays skin-agnostic -
 * heading semantics are a grid concern. The shared column template reaches rows
 * through the inherited `--cngx-dga-columns` custom property (CSS cascade), so it
 * needs no signal here.
 *
 * @category ui/data-grid-accordion
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/data-grid-accordion/data-grid-accordion.token.ts
 * @since 0.1.0
 * @relatedTo CngxDataGridAccordion, CngxDataGridRow
 */
export interface CngxDataGridAccordionContext {
  /** Heading level (2-6) every row's `role="heading"` wrapper reflects via `aria-level`. */
  readonly headingLevel: Signal<number>;
}

/**
 * DI token for the {@link CngxDataGridAccordionContext}.
 * {@link CngxDataGridAccordion} provides it via `useExisting`; each
 * {@link CngxDataGridRow} injects it.
 *
 * @category ui/data-grid-accordion
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/data-grid-accordion/data-grid-accordion.token.ts
 * @since 0.1.0
 * @relatedTo CngxDataGridAccordion, CngxDataGridRow
 */
export const CNGX_DATA_GRID_ACCORDION = new InjectionToken<CngxDataGridAccordionContext>(
  'CNGX_DATA_GRID_ACCORDION',
);
