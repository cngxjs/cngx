import type { CngxChartSummary } from '../i18n/chart-i18n';

/**
 * Pure helper that derives a `CngxChartSummary` from already-projected
 * numeric values plus a list of threshold values. The chart component
 * passes the result to `CngxChartI18n.summary()` to produce the
 * `aria-label` text the host announces to screen readers.
 *
 * Trend rule: if the last value is more than 5% of the data's range
 * above the first, the trend is `'up'`; below, `'down'`; otherwise
 * `'flat'`. The 5% deadband prevents trivial fluctuations from
 * flipping the trend label and keeps the summary stable across
 * minor data refreshes.
 *
 * Threshold rule: a threshold is "crossed" if the data series goes
 * from above to below or vice versa anywhere in the projected range.
 * The returned `thresholds` list is the subset of input thresholds
 * the data actually crosses, in input order.
 */
export function computeChartSummary(
  values: readonly number[],
  thresholds: readonly number[],
): CngxChartSummary {
  if (values.length === 0) {
    return { trend: 'flat', min: 0, max: 0, current: 0, thresholds: [] };
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
  const first = values[0];
  const current = values[values.length - 1];
  const range = max - min;
  const deadband = range * 0.05;
  const delta = current - first;
  const trend: 'up' | 'down' | 'flat' =
    delta > deadband ? 'up' : delta < -deadband ? 'down' : 'flat';
  const crossed = thresholds.filter((t) => crossesThreshold(values, t));
  return { trend, min, max, current, thresholds: crossed };
}

function crossesThreshold(values: readonly number[], threshold: number): boolean {
  let above = values[0] > threshold;
  for (let i = 1; i < values.length; i++) {
    const nowAbove = values[i] > threshold;
    if (nowAbove !== above) {
      return true;
    }
    above = nowAbove;
  }
  return false;
}
