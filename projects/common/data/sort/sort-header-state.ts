import { computed, type Signal } from '@angular/core';

import { type CngxSort, type SortEntry } from './sort.directive';

/**
 * The derived sort-header state a header directive exposes for one column.
 *
 * Pure derivation over a single {@link CngxSort} source plus an imperative
 * `toggle`. No async state, no signal writes outside `toggle`.
 *
 * @category common/data/sort
 */
export interface SortHeaderState {
  /** The active sort entry for this column, or `undefined` when the column is not sorted. */
  readonly entry: Signal<SortEntry | undefined>;
  /** `true` when this column is part of the active sort (primary or secondary). */
  readonly isActive: Signal<boolean>;
  /** `true` when this column is active and sorted ascending. */
  readonly isAsc: Signal<boolean>;
  /** `true` when this column is active and sorted descending. */
  readonly isDesc: Signal<boolean>;
  /**
   * 1-based position of this column in the sort stack, or `0` when it is not active.
   * Only meaningful when `multiSort` is enabled on the owning `CngxSort`.
   */
  readonly priority: Signal<number>;
  /**
   * Toggles this column's sort through `CngxSort.setSort`. Pass the header's own
   * Shift-key read as `additive`; the `multiSort` gate is applied here so the
   * column only joins the stack additively when the owning sort allows it.
   */
  toggle(additive?: boolean): void;
}

/**
 * Derives the shared sort-header state for one column from a {@link CngxSort} getter.
 *
 * Both {@link CngxSortHeader} (table context, `aria-sort`) and `CngxDgaSortHeader`
 * (disclosure context, `role="button"` + `aria-describedby`) compose this factory
 * and keep only their own a11y presentation. The factory is a11y-agnostic - it
 * returns the plain derived signals each header maps to its own DOM/ARIA surface.
 *
 * @param sort Getter for the owning `CngxSort` engine (`() => sortRef`, `() => grid.sort`).
 * @param field Getter for the column's field key.
 * @returns The derived `{ entry, isActive, isAsc, isDesc, priority, toggle }` bundle.
 *
 * @category common/data/sort
 * @since 0.1.0
 * @relatedTo CngxSort, CngxSortHeader
 */
export function createSortHeaderState(sort: () => CngxSort, field: () => string): SortHeaderState {
  const entry = computed(() => sort().sorts().find((s) => s.active === field()));

  const isActive = computed(() => entry() !== undefined);
  const isAsc = computed(() => entry()?.direction === 'asc');
  const isDesc = computed(() => entry()?.direction === 'desc');

  const priority = computed(() => {
    const idx = sort().sorts().findIndex((s) => s.active === field());
    return idx === -1 ? 0 : idx + 1;
  });

  return {
    entry,
    isActive,
    isAsc,
    isDesc,
    priority,
    toggle(additive = false): void {
      sort().setSort(field(), additive && sort().multiSort());
    },
  };
}
