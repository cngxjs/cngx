import { createLinearScale } from './linear';

/**
 * Pure-TS time scale. Reuses {@link createLinearScale} after coercing
 * `Date` endpoints (and inputs) to epoch milliseconds. Supports
 * inverted domains and bare-number timestamps interchangeably.
 *
 * @param domain `[start, end]` time range. `Date` and `number` are
 *   interchangeable on either endpoint.
 * @param range `[start, end]` output range (typically pixel coordinates).
 * @returns `(v: Date | number) => number` mapping time values to range
 *   values.
 */
export function createTimeScale(
  domain: readonly [Date | number, Date | number],
  range: readonly [number, number],
): (v: Date | number) => number {
  const d0 = toMs(domain[0]);
  const d1 = toMs(domain[1]);
  const linear = createLinearScale([d0, d1], range);
  return (v: Date | number) => linear(toMs(v));
}

function toMs(v: Date | number): number {
  return typeof v === 'number' ? v : v.getTime();
}
