import { computed, signal, type Signal } from '@angular/core';

import type { CngxSelectAriaLabels, CngxSelectFallbackLabels } from '../../config';
import type { CngxSelectOptionDef } from '../../option.model';
import { createChipOverflow, type ChipOverflow } from '../chip-overflow';

type ChipOverflowMode = 'wrap' | 'scroll-x' | 'truncate';

const WRAP: Signal<ChipOverflowMode> = signal<ChipOverflowMode>('wrap').asReadonly();
const ONE: Signal<number> = signal(1).asReadonly();

/**
 * Inputs for {@link createSelectSummary}.
 *
 * @internal
 */
export interface SelectSummaryOptions<T> {
  /** Full selected-option projection the trigger renders from. */
  readonly selectedOptions: Signal<CngxSelectOptionDef<T>[]>;
  /** Whether the trigger shows the summary (the touch floor is active). */
  readonly active: Signal<boolean>;
  /** The variant's own overflow strategy, used while the summary is off. Default `'wrap'`. */
  readonly chipOverflow?: Signal<ChipOverflowMode>;
  /** The variant's own chip cap, used while the summary is off. Default `1`. */
  readonly maxVisibleChips?: Signal<number>;
  /** Copy: the `selectionSummary` aria label. */
  readonly ariaLabels: Signal<Required<Pick<CngxSelectAriaLabels, 'selectionSummary'>>>;
  /** Copy: the `chipOverflowBadge` fallback label. */
  readonly fallbackLabels: Signal<Required<Pick<CngxSelectFallbackLabels, 'chipOverflowBadge'>>>;
}

/**
 * Signals returned from {@link createSelectSummary}.
 *
 * @internal
 */
export interface SelectSummary<T> {
  /** Whether the trigger shows the summary. */
  readonly active: Signal<boolean>;
  /**
   * The chip strip derivation. While the summary is on it is truncated at one
   * value, so the summary and the chip branch share one derivation.
   */
  readonly strip: ChipOverflow<T>;
  /** First selected option, the visible summary label. `null` when nothing is selected. */
  readonly first: Signal<CngxSelectOptionDef<T> | null>;
  /** Count behind the badge: the selected values after the first. `0` while the summary is off. */
  readonly badgeCount: Signal<number>;
  /** Visible badge text (`+N`, the reading locale's digits). Empty without a badge. */
  readonly badgeText: Signal<string>;
  /** Selected options behind the badge, in selection order. */
  readonly hidden: Signal<readonly CngxSelectOptionDef<T>[]>;
  /**
   * The whole selection as one string for AT: empty for no value, the label
   * for one, the `selectionSummary` copy for two or more.
   */
  readonly fullText: Signal<string>;
  /**
   * The whole selection for AT while the summary is off and a `'truncate'`
   * strip hides values behind its `aria-hidden` badge: the `selectionSummary`
   * copy. Empty while nothing is hidden or the summary is on.
   */
  readonly hiddenSummaryText: Signal<string>;
  /** `fullText` while the summary is on, else `hiddenSummaryText`. */
  readonly accessibleText: Signal<string>;
}

/**
 * Summary-trigger derivation of the multi-value selects: the first label plus
 * a `+N` badge and the full selection as text for AT.
 *
 * Built on {@link createChipOverflow}: while `active()` the strip runs in
 * `'truncate'` at one chip, so the first visible option is the summary label,
 * the overflow count is the badge and the hidden options are the rest. While
 * inactive the variant's own `chipOverflow` / `maxVisibleChips` pass through
 * unchanged, so a variant that renders chips keeps one derivation for both
 * branches.
 *
 * @internal
 */
export function createSelectSummary<T>(opts: SelectSummaryOptions<T>): SelectSummary<T> {
  const ownMode = opts.chipOverflow ?? WRAP;
  const ownCap = opts.maxVisibleChips ?? ONE;
  const strip = createChipOverflow<T>({
    selectedOptions: opts.selectedOptions,
    chipOverflow: computed(() => (opts.active() ? 'truncate' : ownMode())),
    maxVisibleChips: computed(() => (opts.active() ? 1 : ownCap())),
  });

  const first = computed<CngxSelectOptionDef<T> | null>(() =>
    opts.active() ? (strip.visibleSelected()[0] ?? null) : null,
  );
  const badgeCount = computed(() => (opts.active() ? strip.overflowBadgeCount() : 0));
  const badgeText = computed(() => {
    const count = badgeCount();
    return count > 0 ? opts.fallbackLabels().chipOverflowBadge(count) : '';
  });
  const fullText = computed(() => {
    if (!opts.active()) {
      return '';
    }
    const all = opts.selectedOptions();
    if (all.length === 0) {
      return '';
    }
    if (all.length === 1) {
      return all[0].label;
    }
    return opts.ariaLabels().selectionSummary(all.map((option) => option.label));
  });
  const hiddenSummaryText = computed(() => {
    if (opts.active() || strip.overflowBadgeCount() === 0) {
      return '';
    }
    return opts.ariaLabels().selectionSummary(opts.selectedOptions().map((o) => o.label));
  });
  const accessibleText = computed(() => fullText() || hiddenSummaryText());

  return {
    active: opts.active,
    strip,
    first,
    badgeCount,
    badgeText,
    hidden: strip.hiddenSelected,
    fullText,
    hiddenSummaryText,
    accessibleText,
  };
}
