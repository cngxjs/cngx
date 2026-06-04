/**
 * Clamp a number into the inclusive range `[min, max]`. `null` or
 * `undefined` bounds read as `-Infinity` / `+Infinity` respectively, so
 * either side can be left open. `NaN` value propagates and is returned
 * unchanged. When the bounds invert (`min > max` after coercion), `min`
 * wins and the returned value is `min`.
 *
 * @category utils
 */
export function clamp(
  value: number,
  min: number | null | undefined,
  max: number | null | undefined,
): number {
  if (Number.isNaN(value)) {
    return value;
  }
  const lo = min ?? -Infinity;
  const hi = max ?? Infinity;
  if (lo > hi) {
    return lo;
  }
  if (value < lo) {
    return lo;
  }
  if (value > hi) {
    return hi;
  }
  return value;
}
