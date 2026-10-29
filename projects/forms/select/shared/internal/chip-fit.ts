import { sameArrayContents } from './compare';

/**
 * One measurement of a `'fit'` chip strip, in px. Every value depends on the
 * strip alone, never on how many chips the last read let through.
 *
 * @internal
 */
export interface ChipFitSnapshot {
  /** Content-box inline size of the strip. */
  readonly available: number;
  /** The strip's `column-gap`. */
  readonly gap: number;
  /** Inline space kept free for the `+N` badge. */
  readonly reserve: number;
  /** Inline size of every chip slot, in DOM order. */
  readonly widths: readonly number[];
}

/**
 * How many leading chip slots fit the strip. All of them when they fit
 * without a badge; otherwise the largest `k` whose slots, `k` gaps and the
 * badge reserve fit, floored at `1` (a slot is capped at
 * `available - reserve - gap`, so the first one always fits next to the
 * badge). `0` when that cap is zero or less, leaving only the badge, and for
 * an empty strip; `null` before the first measurement.
 *
 * @internal
 */
export function fitChipCount(snapshot: ChipFitSnapshot | null): number | null {
  if (!snapshot) {
    return null;
  }
  const { available, gap, reserve, widths } = snapshot;
  const total = widths.length;
  if (total === 0) {
    return 0;
  }
  // Slots are capped at `available - reserve - gap`; at zero or less every
  // slot collapses, so the widths sum to nothing and would read as "all fit".
  // Only the badge is left.
  if (available - reserve - gap <= 0) {
    return 0;
  }
  let used = 0;
  for (let i = 0; i < total; i++) {
    used += widths[i] + (i > 0 ? gap : 0);
  }
  if (used <= available) {
    return total;
  }
  let fitted = 0;
  let withReserve = reserve;
  for (let i = 0; i < total; i++) {
    withReserve += widths[i] + gap;
    if (withReserve > available) {
      break;
    }
    fitted = i + 1;
  }
  return Math.max(1, fitted);
}

/**
 * Structural equality for {@link ChipFitSnapshot}, so an equal re-read keeps
 * the snapshot signal's reference.
 *
 * @internal
 */
export function chipFitSnapshotEqual(a: ChipFitSnapshot | null, b: ChipFitSnapshot | null): boolean {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return (
    a.available === b.available &&
    a.gap === b.gap &&
    a.reserve === b.reserve &&
    sameArrayContents(a.widths, b.widths, Object.is)
  );
}
