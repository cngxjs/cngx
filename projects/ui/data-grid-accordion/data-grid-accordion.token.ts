import { InjectionToken, type Signal, type WritableSignal } from '@angular/core';

import type { CngxFilter, CngxSort } from '@cngx/common/data';

/**
 * UI-local context a {@link CngxDataGridAccordion} exposes so each
 * {@link CngxDataGridRow} reads the shared heading level without injecting the
 * concrete group class (cyclic type, blocks Atomic Decompose). Kept separate from
 * the headless `CNGX_ACCORDION` brain contract, which stays skin-agnostic -
 * heading semantics are a grid concern. The shared column template reaches rows
 * through the inherited `--cngx-dga-columns` custom property (CSS cascade), so it
 * needs no signal here.
 *
 * The group also hosts the orthogonal {@link CngxSort} and {@link CngxFilter} atoms and
 * exposes them here as `sort` and `filter`, so `cngxDgaSortHeader` cells drive the sort
 * with no `[cngxSortRef]` and the `cngxDgaFilter` slot writes `filterTerm`. The context
 * still carries state only - the consumer's `computed()` derives the visible + ordered
 * rows.
 *
 * @category ui/data-grid-accordion
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/data-grid-accordion/data-grid-accordion.token.ts
 * @since 0.1.0
 * @relatedTo CngxDataGridAccordion, CngxDataGridRow, CngxSort, CngxFilter
 */
export interface CngxDataGridAccordionContext {
  /** Heading level (2-6) every row's `role="heading"` wrapper reflects via `aria-level`. */
  readonly headingLevel: Signal<number>;
  /**
   * The group's hosted {@link CngxSort}. `cngxDgaSortHeader` cells read its `sorts()`
   * and call `setSort(...)`; a consumer derives the ordered rows from it via `computed()`.
   */
  readonly sort: CngxSort;
  /**
   * The group's hosted {@link CngxFilter}. `[filterPredicate]` feeds its controlled
   * predicate; a consumer reads `filter.predicate()` (or drives `addPredicate` for facet
   * filtering) and derives the visible rows via `computed()`.
   */
  readonly filter: CngxFilter;
  /**
   * The simple text filter term, two-way bindable as `[(filterTerm)]`. The `cngxDgaFilter`
   * input writes it (debounced); a consumer matches it against its own row fields in a
   * `computed()`. Writable so the slot directive can set it.
   */
  readonly filterTerm: WritableSignal<string>;
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
