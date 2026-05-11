/**
 * Internal `equal` fn helpers shared by the chart graph's bespoke
 * cascade guards. Each helper is two-line trivial; the bespoke fns on
 * heterogeneous shapes (axis tick rendering, layer rect/circle arrays)
 * stay inline at their call sites — this file only carries the
 * recurring shapes (numeric arrays, dimension objects).
 *
 * Not exported from `public-api.ts`. Internal to `@cngx/common/chart`.
 *
 * @internal
 */

/**
 * Length + `Object.is` per-index equality on a readonly numeric array.
 * Used by `summaryValues` and `summary.thresholds`. Reference-equal
 * arrays short-circuit immediately.
 */
export function sameNumberArr(a: readonly number[], b: readonly number[]): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) {
      return false;
    }
  }
  return true;
}

/**
 * Field-wise equality on the chart's `{ width, height }` dimension
 * shape. Used by the `dimensions` computed; every `ResizeObserver` tick
 * produces a fresh literal even when the numeric pair is unchanged, so
 * an `equal` fn on this signal is the foundation of the chart-graph
 * cascade short-circuit.
 */
export function dimensionsEqual(
  a: { width: number; height: number },
  b: { width: number; height: number },
): boolean {
  return a.width === b.width && a.height === b.height;
}
