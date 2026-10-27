/**
 * Pure-TS linear scale. Maps a numeric domain `[d0, d1]` to a numeric
 * range `[r0, r1]` via standard linear interpolation. Domain may be
 * inverted (`d0 > d1`) for SVG Y-axes where the top of the chart is the
 * highest data value but the lowest pixel coordinate.
 *
 * Values outside the domain extrapolate. Charts that need overflow
 * clamping clamp at the data layer, not the scale.
 *
 * @param domain `[start, end]` data range. Equal endpoints collapse the
 *   scale to a constant function returning `range[0]`.
 * @param range `[start, end]` output range (typically pixel coordinates).
 * @returns `(v: number) => number` mapping domain values to range values.
 */
export function createLinearScale(
  domain: readonly [number, number],
  range: readonly [number, number],
): (v: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const dSpan = d1 - d0;
  if (dSpan === 0) {
    return () => r0;
  }
  const rSpan = r1 - r0;
  return (v: number) => r0 + ((v - d0) / dSpan) * rSpan;
}
