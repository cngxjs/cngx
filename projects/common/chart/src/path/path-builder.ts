import { buildCurvePath, type CngxCurve, type PathPoint } from './curve';
import type { ScaleFn, XScaleInput } from '../chart/chart-context';

export type LineYAccessor<T> = (d: T, i: number) => number;
export type LineXAccessor<T> = (d: T, i: number) => XScaleInput;

export interface PathBuilderOptions<T> {
  readonly y: LineYAccessor<T>;
  readonly x?: LineXAccessor<T>;
  readonly curve: CngxCurve;
}

export interface PathBuilder<T> {
  /**
   * Build the SVG `d` attribute for the given data + scales. Same
   * `(data, xScale, yScale)` triple by reference returns the cached
   * string without re-running the O(n) point projection.
   */
  build(
    data: readonly T[],
    xScale: ScaleFn<XScaleInput>,
    yScale: ScaleFn<number>,
  ): string;

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
 * dep. Compute guard only — does not know about signals or `equal`
 * functions; the `d` computed in `<cngx-line>` carries the cascade
 * guard separately.
 *
 * The cache returns the previous result when all three inputs are
 * reference-equal to the previous call. Any reference mismatch
 * triggers a rebuild and updates the slot.
 */
export function createPathBuilder<T>(opts: PathBuilderOptions<T>): PathBuilder<T> {
  const yAcc = opts.y;
  const xAcc: LineXAccessor<T> = opts.x ?? ((_, i) => i);
  const curve = opts.curve;

  let lastData: readonly T[] | null = null;
  let lastX: ScaleFn<XScaleInput> | null = null;
  let lastY: ScaleFn<number> | null = null;
  let lastResult = '';
  let rebuilds = 0;

  return {
    build(data, xScale, yScale) {
      if (data === lastData && xScale === lastX && yScale === lastY) {
        return lastResult;
      }
      const points = projectPoints(data, xAcc, yAcc, xScale, yScale);
      const d = buildCurvePath(points, curve);
      lastData = data;
      lastX = xScale;
      lastY = yScale;
      lastResult = d;
      rebuilds++;
      return d;
    },
    rebuildCount() {
      return rebuilds;
    },
  };
}

function projectPoints<T>(
  data: readonly T[],
  xAcc: LineXAccessor<T>,
  yAcc: (d: T, i: number) => number,
  xScale: ScaleFn<XScaleInput>,
  yScale: ScaleFn<number>,
): PathPoint[] {
  const out = new Array<PathPoint>(data.length);
  for (let i = 0; i < data.length; i++) {
    out[i] = { x: xScale(xAcc(data[i], i)), y: yScale(yAcc(data[i], i)) };
  }
  return out;
}
