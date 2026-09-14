/**
 * Scan description for {@link resolveStepFrom} and {@link resolveBoundaryStep}.
 *
 * @category core/nav
 */
export interface CngxStepScan {
  /** Total number of indices in the range `[0, count)`. */
  readonly count: number;
  /**
   * Wrap around the boundaries via modulo instead of stopping. Default
   * `false`: a probe outside the range resolves to `null`.
   */
  readonly loop?: boolean;
  /**
   * Disabled predicate per index. Omitted, every index counts as enabled
   * (the virtual-window case: unrendered items' disabled state is
   * unknowable, so they must stay reachable).
   */
  readonly isDisabledAt?: (index: number) => boolean;
}

/**
 * Resolve the next enabled index from `current` in `direction`, skipping
 * disabled indices, wrapping under `loop`, or `null` when no enabled index
 * is reachable. The shared kernel of every next/prev-with-disabled-skip
 * iterator (active-descendant, roving tabindex, stepper strip, chip-strip
 * roving) - previously four private copies.
 *
 * Arithmetic contract (ported exactly from the active-descendant strategy,
 * the strictest of the four sites):
 *
 * - A negative `current` enters from the approach edge: `-1` when stepping
 *   forward (first probe is index `0`), `count` when stepping backward
 *   (first probe is `count - 1`).
 * - `current >= count` is NOT remapped - every probe is bounds-checked, so
 *   the first out-of-range probe resolves to `null` without `loop` and
 *   wraps via modulo with it.
 * - At most `count` probes run; a fully disabled range resolves to `null`.
 *
 * Callers with clamp semantics (stop at the boundary, keep the current
 * index) compose the resolver as `resolveStepFrom(...) ?? current`.
 *
 * Like {@link resolveInlineStep}, this is a pure function, not a DI
 * chokepoint - each strategy owns its `isDisabledAt` adapter and calls it
 * directly. The direction axis (RTL arrow flip) stays in `resolveInlineStep`;
 * this kernel owns only the index axis.
 *
 * @param current The index to step from.
 * @param direction `1` steps forward, `-1` backward.
 * @param scan The range description.
 * @returns The next enabled index, or `null` when none is reachable.
 *
 * @category core/nav
 * @relatedTo resolveBoundaryStep
 * @relatedTo resolveInlineStep
 * @since 0.1.0
 */
export function resolveStepFrom(
  current: number,
  direction: 1 | -1,
  scan: CngxStepScan,
): number | null {
  const count = scan.count;
  if (count === 0) {
    return null;
  }
  const loop = scan.loop ?? false;
  const isDisabledAt = scan.isDisabledAt;

  let idx = current < 0 ? (direction === 1 ? -1 : count) : current;
  for (let step = 0; step < count; step++) {
    idx += direction;
    if (idx < 0 || idx >= count) {
      if (!loop) {
        return null;
      }
      idx = ((idx % count) + count) % count;
    }
    if (!isDisabledAt?.(idx)) {
      return idx;
    }
  }
  return null;
}

/**
 * Resolve the first (`direction: 1`) or last (`direction: -1`) enabled
 * index of the range, or `null` when the range is empty or fully disabled.
 * The Home/End counterpart of {@link resolveStepFrom}.
 *
 * @param direction `1` scans from the start, `-1` from the end.
 * @param scan The range description (`loop` is irrelevant here).
 * @returns The boundary-nearest enabled index, or `null`.
 *
 * @category core/nav
 * @relatedTo resolveStepFrom
 * @relatedTo resolveInlineStep
 * @since 0.1.0
 */
export function resolveBoundaryStep(direction: 1 | -1, scan: CngxStepScan): number | null {
  const count = scan.count;
  if (count === 0) {
    return null;
  }
  const isDisabledAt = scan.isDisabledAt;
  if (direction === 1) {
    for (let i = 0; i < count; i++) {
      if (!isDisabledAt?.(i)) {
        return i;
      }
    }
  } else {
    for (let i = count - 1; i >= 0; i--) {
      if (!isDisabledAt?.(i)) {
        return i;
      }
    }
  }
  return null;
}
