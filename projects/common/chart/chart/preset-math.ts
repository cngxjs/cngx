/**
 * Shared numeric helpers for the chart presets and the auto-summary.
 * Pure TS, no Angular dep, imports nothing - which is why it lives in
 * the core `chart/` folder: presets compose `chart/`, so a helper both
 * sides consume must not sit in `presets/`. Internal - the presets and
 * the summary are the API surface.
 */

/**
 * Single-pass min/max scan. Returns `null` for an empty input so the
 * caller decides its own fallback domain.
 *
 * @internal
 */
export function scanMinMax(values: readonly number[]): { min: number; max: number } | null {
  if (values.length === 0) {
    return null;
  }
  let min = values[0];
  let max = values[0];
  for (let i = 1; i < values.length; i++) {
    const v = values[i];
    if (v < min) {
      min = v;
    }
    if (v > max) {
      max = v;
    }
  }
  return { min, max };
}

/**
 * Positional x-domain for an index-keyed preset series: `[0, n - 1]`,
 * falling back to `[0, 1]` below two points so the scale never
 * degenerates to a zero-width domain.
 *
 * @internal
 */
export function presetIndexDomain(length: number): readonly number[] {
  return length < 2 ? [0, 1] : [0, length - 1];
}

/**
 * Value y-domain for a preset series: `[min, max]` of the data, padded
 * to `[v - 1, v + 1]` when the series is flat (a zero-height domain
 * would collapse the scale) and `[0, 1]` when it is empty.
 *
 * @internal
 */
export function presetValueDomain(values: readonly number[]): readonly number[] {
  const scan = scanMinMax(values);
  if (scan === null) {
    return [0, 1];
  }
  if (scan.min === scan.max) {
    return [scan.min - 1, scan.max + 1];
  }
  return [scan.min, scan.max];
}

/**
 * Position of `value` inside `[min, max]` as a ratio clamped to
 * `[0, 1]`. A degenerate range (`max <= min`) yields `0` - every
 * preset renders an empty fill rather than dividing by zero.
 *
 * @internal
 */
export function clampedRatio(value: number, min: number, max: number): number {
  if (max <= min) {
    return 0;
  }
  const ratio = (value - min) / (max - min);
  if (ratio < 0) {
    return 0;
  }
  if (ratio > 1) {
    return 1;
  }
  return ratio;
}
