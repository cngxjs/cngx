import { computed, type Signal } from '@angular/core';

import type { CngxSelectOptionDef } from '../option.model';

/**
 * Inputs for {@link createChipOverflow}.
 *
 * @internal
 */
export interface ChipOverflowOptions<T> {
  /** Full selected-option projection the chip strip renders from. */
  readonly selectedOptions: Signal<CngxSelectOptionDef<T>[]>;
  /** Overflow strategy. See `CngxSelectConfig.chipOverflow`. */
  readonly chipOverflow: Signal<'wrap' | 'scroll-x' | 'truncate'>;
  /** Chip cap in `'truncate'`; floored to 1. */
  readonly maxVisibleChips: Signal<number>;
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
   * {@link ChipOverflow.overflowBadgeCount}.
   */
  readonly visibleSelected: Signal<CngxSelectOptionDef<T>[]>;
  /**
   * Count of selected options hidden by `'truncate'`. Zero in
   * `'wrap'` / `'scroll-x'` so the badge binding stays a single
   * numeric expression.
   */
  readonly overflowBadgeCount: Signal<number>;
}

/**
 * Chip-strip overflow derivation shared by the chip-rendering array
 * variants (`CngxMultiSelect`, `CngxCombobox`).
 *
 * @internal
 */
export function createChipOverflow<T>(opts: ChipOverflowOptions<T>): ChipOverflow<T> {
  const visibleSelected = computed<CngxSelectOptionDef<T>[]>(() => {
    const all = opts.selectedOptions();
    if (opts.chipOverflow() !== 'truncate') {
      return all;
    }
    const cap = Math.max(1, opts.maxVisibleChips());
    return all.length <= cap ? all : all.slice(0, cap);
  });

  const overflowBadgeCount = computed<number>(() => {
    if (opts.chipOverflow() !== 'truncate') {
      return 0;
    }
    const total = opts.selectedOptions().length;
    const cap = Math.max(1, opts.maxVisibleChips());
    return total > cap ? total - cap : 0;
  });

  return { visibleSelected, overflowBadgeCount };
}
