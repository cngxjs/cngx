/**
 * Pure-TS band scale. Maps a discrete categorical domain to evenly
 * spaced positions along a numeric range. Each band reserves equal
 * width; padding shrinks the band by a fraction of its slot.
 *
 * Result is a callable carrying a `bandwidth()` method so layer atoms
 * (`<cngx-bar>`, ...) can read both the position and the slot width.
 *
 * @param domain Ordered list of categorical values. Values are matched
 *   by reference equality on lookup; pass primitives or stable refs.
 * @param range `[start, end]` output range.
 * @param padding Fraction of each slot reserved as inter-band gap.
 *   Default `0` (no gap). Range `[0, 1)`.
 * @returns Callable `(v: T) => number` returning the **leading edge** of
 *   the band, with a `bandwidth()` method returning the band width.
 *   Lookup of an unknown value returns `NaN`.
 */
export interface BandScale<T> {
  (v: T): number;
  bandwidth(): number;
}

export function createBandScale<T>(
  domain: readonly T[],
  range: readonly [number, number],
  padding = 0,
): BandScale<T> {
  const [r0, r1] = range;
  const n = domain.length;
  const span = r1 - r0;
  const slot = n === 0 ? 0 : span / n;
  const inner = slot * (1 - padding);
  const offset = (slot - inner) / 2;

  const lookup = new Map<T, number>();
  for (let i = 0; i < n; i++) {
    lookup.set(domain[i], r0 + i * slot + offset);
  }

  const fn: BandScale<T> = ((v: T) => {
    return lookup.get(v) ?? NaN;
  }) as BandScale<T>;
  fn.bandwidth = () => inner;
  return fn;
}
