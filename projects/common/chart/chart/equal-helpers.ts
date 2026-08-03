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

import type { CngxChartInset, CngxChartPlotArea } from './chart-context';

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
 * Length + `Object.is` per-index equality on any readonly array. The
 * generic sibling of {@link sameNumberArr}: `injectChartBuffer` stores the
 * pushed rows by reference, so a flush that reselects the same rows in the
 * same order yields an element-wise-identical projection even though
 * `snapshot()` allocates a fresh wrapper each call. Reference equality would
 * never fire here (the wrapper is always new); element-wise is the only
 * guard that dedups the buffer's `points` cascade.
 */
export function sameItemsArr<T>(a: readonly T[], b: readonly T[]): boolean {
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

/**
 * Field-wise equality on the chart's four-sided axis inset. The `inset`
 * computed rebuilds its literal whenever the projected axis set
 * re-emits, so without this guard an unchanged axis set would cascade
 * into the plot area and from there into both scale ranges and every
 * axis geometry on each pass.
 */
export function insetEqual(a: CngxChartInset, b: CngxChartInset): boolean {
  return (
    a.inlineStart === b.inlineStart &&
    a.inlineEnd === b.inlineEnd &&
    a.blockStart === b.blockStart &&
    a.blockEnd === b.blockEnd
  );
}

/**
 * Field-wise equality on the published plot rectangle. Only the four
 * corners are compared - `width`/`height` are derived from them, so an
 * equal pair of corners implies equal extents.
 */
export function plotAreaEqual(a: CngxChartPlotArea, b: CngxChartPlotArea): boolean {
  return a.x0 === b.x0 && a.y0 === b.y0 && a.x1 === b.x1 && a.y1 === b.y1;
}
