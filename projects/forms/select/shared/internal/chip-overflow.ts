import { computed, type Signal } from '@angular/core';

import type { CngxSelectOptionDef } from '../option.model';
import { sameArrayContents } from './compare';
import { coerceMaxVisibleChips } from './resolve-config';

const NO_HIDDEN: readonly never[] = Object.freeze([]) as readonly never[];

/**
 * Inputs for {@link createChipOverflow}.
 *
 * @internal
 */
export interface ChipOverflowOptions<T> {
  /** Full selected-option projection the chip strip renders from. */
  readonly selectedOptions: Signal<CngxSelectOptionDef<T>[]>;
  /** Overflow strategy. See `CngxSelectConfig.chipOverflow`. */
  readonly chipOverflow: Signal<'wrap' | 'scroll-x' | 'truncate' | 'fit'>;
  /** Chip cap in `'truncate'`; coerced by `coerceMaxVisibleChips`. */
  readonly maxVisibleChips: Signal<number>;
  /** Chip cap in `'fit'`: how many chips the measured strip holds. */
  readonly fitCount: Signal<number>;
}

/**
 * Signals returned from {@link createChipOverflow}.
 *
 * @internal
 */
export interface ChipOverflow<T> {
  /**
   * Chip subset rendered into the trigger strip. In `'wrap'` /
   * `'scroll-x'` identical to `selectedOptions`; layout divergence is
   * pure CSS via `data-overflow`. In `'truncate'` the first
   * `maxVisibleChips()` entries - remainder feeds
   * {@link ChipOverflow.overflowBadgeCount}. In `'fit'` the first
   * `fitCount()` entries.
   */
  readonly visibleSelected: Signal<CngxSelectOptionDef<T>[]>;
  /**
   * Chips the strip renders. In `'fit'` every selected option, since the
   * slots past the cap stay in layout (hidden) to keep the measurement
   * independent of the fit result; otherwise `visibleSelected`.
   */
  readonly renderedSelected: Signal<CngxSelectOptionDef<T>[]>;
  /** Length of `visibleSelected`: rendered chips at this index or later are hidden. */
  readonly visibleCount: Signal<number>;
  /** Whether the strip runs in `'fit'` and should be measured. */
  readonly fitActive: Signal<boolean>;
  /**
   * First rendered index the `'fit'` strip folds behind the badge;
   * `Infinity` outside `'fit'`, so `index >= fitHiddenFrom()` is the one
   * hidden-slot check.
   */
  readonly fitHiddenFrom: Signal<number>;
  /**
   * Count of selected options hidden by `'truncate'` or `'fit'`. Zero in
   * `'wrap'` / `'scroll-x'` so the badge binding stays a single
   * numeric expression.
   */
  readonly overflowBadgeCount: Signal<number>;
  /**
   * Selected options hidden by `'truncate'` or `'fit'`, in selection order. Empty in
   * `'wrap'` / `'scroll-x'`. Structurally equal across reads, so the array
   * keeps its identity while the hidden set is unchanged.
   */
  readonly hiddenSelected: Signal<readonly CngxSelectOptionDef<T>[]>;
}

/**
 * Chip-strip overflow derivation shared by the chip-rendering array
 * variants (`CngxMultiSelect`, `CngxCombobox`, `CngxActionMultiSelect`).
 *
 * @internal
 */
export function createChipOverflow<T>(opts: ChipOverflowOptions<T>): ChipOverflow<T> {
  // `null` = no cap: every selected chip is visible.
  const cap = computed<number | null>(() => {
    const mode = opts.chipOverflow();
    if (mode === 'fit') {
      return opts.fitCount();
    }
    if (mode === 'truncate') {
      return coerceMaxVisibleChips(opts.maxVisibleChips());
    }
    return null;
  });

  const visibleSelected = computed<CngxSelectOptionDef<T>[]>(
    () => {
      const all = opts.selectedOptions();
      const limit = cap();
      return limit === null || all.length <= limit ? all : all.slice(0, limit);
    },
    // Structural equal - the capped slice mints a new array per read.
    { equal: (a, b) => sameArrayContents(a, b, Object.is) },
  );

  const fitActive = computed(() => opts.chipOverflow() === 'fit');

  const renderedSelected = computed<CngxSelectOptionDef<T>[]>(
    () => (fitActive() ? opts.selectedOptions() : visibleSelected()),
    { equal: (a, b) => sameArrayContents(a, b, Object.is) },
  );

  const visibleCount = computed(() => visibleSelected().length);
  const fitHiddenFrom = computed(() => (fitActive() ? visibleCount() : Infinity));

  const overflowBadgeCount = computed<number>(() => {
    const limit = cap();
    const total = opts.selectedOptions().length;
    return limit !== null && total > limit ? total - limit : 0;
  });

  const hiddenSelected = computed<readonly CngxSelectOptionDef<T>[]>(
    () => {
      const all = opts.selectedOptions();
      const limit = cap();
      return limit === null || all.length <= limit ? NO_HIDDEN : all.slice(limit);
    },
    { equal: (a, b) => sameArrayContents(a, b, Object.is) },
  );

  return {
    visibleSelected,
    renderedSelected,
    visibleCount,
    fitActive,
    fitHiddenFrom,
    overflowBadgeCount,
    hiddenSelected,
  };
}
