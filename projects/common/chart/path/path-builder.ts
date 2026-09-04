import { buildCurvePath, type CngxCurve, type PathPoint } from './curve';
import type { ScaleFn, XScaleInput } from '../chart/chart-context';

/**
 * Reads the Y value of a data row at index `i`.
 *
 * @category common/chart/path
 */
export type LineYAccessor<T> = (d: T, i: number) => number;
/**
 * Reads the X value of a data row at index `i`. Default behaviour
 * (when omitted on a builder) is the row's positional index.
 *
 * @category common/chart/path
 */
export type LineXAccessor<T> = (d: T, i: number) => XScaleInput;

/**
 * Construction options for {@link createPathBuilder}.
 *
 * @category common/chart/path
 */
export interface PathBuilderOptions<T> {
  readonly y: LineYAccessor<T>;
  readonly x?: LineXAccessor<T>;
  readonly curve: CngxCurve;
}

/**
 * One run of consecutive finite points, as produced by
 * {@link PathBuilder.buildSegments}. `firstX` / `lastX` are the run's
 * projected end coordinates, exposed so an area layer can close the
 * run to its baseline without re-projecting the data.
 *
 * @category common/chart/path
 */
export interface PathSegment {
  readonly d: string;
  readonly firstX: number;
  readonly lastX: number;
}

/**
 * Single-slot LRU cache around an SVG `d`-attribute builder. Returned
 * by {@link createPathBuilder}; consumed by the `<cngx-line>` /
 * `<cngx-area>` family.
 *
 * @category common/chart/path
 */
export interface PathBuilder<T> {
  /**
   * Build the SVG `d` attribute for the given data + scales. Same
   * `(data, xScale, yScale)` triple by reference returns the cached
   * string without re-running the O(n) point projection.
   *
   * A row whose projected `x` or `y` is non-finite (a `NaN` value, an
   * invalid Date, a log scale fed zero) is not emitted as a path
   * command - it breaks the path into subpaths, d3's `defined()`
   * semantics. One `NaN` therefore renders as a gap in the line rather
   * than invalidating the whole `d` string.
   */
  build(data: readonly T[], xScale: ScaleFn<XScaleInput>, yScale: ScaleFn<number>): string;

  /**
   * The same projection split at non-finite rows: one entry per run of
   * consecutive finite points, carrying the run's path data and its
   * first/last projected `x`. `<cngx-area>` consumes this to close
   * every run to the baseline individually - closing the joined string
   * once would fill straight across the gaps. Shares the single-slot
   * cache with {@link build}.
   */
  buildSegments(
    data: readonly T[],
    xScale: ScaleFn<XScaleInput>,
    yScale: ScaleFn<number>,
  ): readonly PathSegment[];

  /**
   * Number of times the internal point-projection + path-string
   * concatenation has run since this builder was constructed. Exposed
   * for the compute-guard isolated spec; not part of the public chart
   * API.
   */
  rebuildCount(): number;
}

/**
 * Pure-TS path builder with single-slot LRU memo on
 * `(data, xScale, yScale)` reference identity. Pure TS, no Angular
 * dep. Compute guard only - does not know about signals or `equal`
 * functions; the `d` computed in `<cngx-line>` carries the cascade
 * guard separately.
 *
 * The cache returns the previous result when all three inputs are
 * reference-equal to the previous call. Any reference mismatch
 * triggers a rebuild and updates the slot.
 *
 * Each call to `createPathBuilder` returns a fresh builder with its
 * own `lastData / lastX / lastY` slots - there is no cross-call /
 * cross-consumer state. The cascade guard for layer atoms is the
 * `equal: (a, b) => a === b` on the `builder` `computed`; combined
 * with Angular signals' default behaviour of skipping re-emissions
 * when the inputs to the `computed` are unchanged, two consecutive
 * cascade ticks with the same `(y, x, curve)` produce the same
 * builder instance.
 *
 * @category common/chart/path
 */
export function createPathBuilder<T>(opts: PathBuilderOptions<T>): PathBuilder<T> {
  const yAcc = opts.y;
  const xAcc: LineXAccessor<T> = opts.x ?? ((_, i) => i);
  const curve = opts.curve;

  let lastData: readonly T[] | null = null;
  let lastX: ScaleFn<XScaleInput> | null = null;
  let lastY: ScaleFn<number> | null = null;
  let lastSegments: readonly PathSegment[] = [];
  let lastResult = '';
  let rebuilds = 0;

  const rebuild = (
    data: readonly T[],
    xScale: ScaleFn<XScaleInput>,
    yScale: ScaleFn<number>,
  ): void => {
    if (data === lastData && xScale === lastX && yScale === lastY) {
      return;
    }
    const runs = projectFiniteRuns(data, xAcc, yAcc, xScale, yScale);
    lastSegments = runs.map((run) => ({
      d: buildCurvePath(run, curve),
      firstX: run[0].x,
      lastX: run[run.length - 1].x,
    }));
    lastResult = lastSegments.map((s) => s.d).join(' ');
    lastData = data;
    lastX = xScale;
    lastY = yScale;
    rebuilds++;
  };

  return {
    build(data, xScale, yScale) {
      rebuild(data, xScale, yScale);
      return lastResult;
    },
    buildSegments(data, xScale, yScale) {
      rebuild(data, xScale, yScale);
      return lastSegments;
    },
    rebuildCount() {
      return rebuilds;
    },
  };
}

/**
 * Project every row and split the result at non-finite coordinates:
 * returns the runs of consecutive points whose `x` and `y` are both
 * finite. Non-finite rows appear in no run - they are the breaks.
 *
 * @internal
 */
function projectFiniteRuns<T>(
  data: readonly T[],
  xAcc: LineXAccessor<T>,
  yAcc: (d: T, i: number) => number,
  xScale: ScaleFn<XScaleInput>,
  yScale: ScaleFn<number>,
): PathPoint[][] {
  const runs: PathPoint[][] = [];
  let current: PathPoint[] | null = null;
  for (let i = 0; i < data.length; i++) {
    const x = xScale(xAcc(data[i], i));
    const y = yScale(yAcc(data[i], i));
    if (Number.isFinite(x) && Number.isFinite(y)) {
      if (current === null) {
        current = [];
        runs.push(current);
      }
      current.push({ x, y });
    } else {
      current = null;
    }
  }
  return runs;
}
