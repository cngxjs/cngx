import type { ScaleFn, XScaleInput } from '../chart/chart-context';
import type { LineXAccessor, LineYAccessor } from '../path/path-builder';
import type { LayerGeometry } from './chart-layer';

/**
 * Scale-projected centre of a single point marker on a line / area
 * layer.
 *
 * @internal
 */
export interface PointMark {
  readonly cx: number;
  readonly cy: number;
}

/**
 * Shared stable empty-marks reference, so the "no markers" case does
 * not allocate a fresh array that would defeat the geometry `equal`.
 *
 * @internal
 */
export const EMPTY_POINTS: readonly PointMark[] = [];

/**
 * Project the datapoints a line / area layer chooses to mark into
 * pixel-space centres. Markers draw when `mode` is `'always'`, or
 * `'auto'` with a single datum - the frame a warming series passes
 * through that would otherwise paint an invisible zero-length path.
 * Pure: the caller reads the signals inside its `computed`; this only
 * maps the resolved values, so line and area share one derivation.
 *
 * @internal
 */
export function derivePointMarks<T>(
  mode: 'auto' | 'always' | 'never',
  data: readonly T[],
  xScale: ScaleFn<XScaleInput>,
  yScale: ScaleFn<number>,
  yAcc: LineYAccessor<T>,
  xAcc: LineXAccessor<T>,
): readonly PointMark[] {
  const draw = mode === 'always' || (mode === 'auto' && data.length === 1);
  if (!draw || data.length === 0) {
    return EMPTY_POINTS;
  }
  const out = new Array<PointMark>(data.length);
  for (let i = 0; i < data.length; i++) {
    out[i] = { cx: xScale(xAcc(data[i], i)), cy: yScale(yAcc(data[i], i)) };
  }
  return out;
}

/**
 * Structural equality for the shared `'line' | 'area'` geometry
 * variant: `d` string, scalar stroke / fill / opacity fields, and a
 * length-plus-elementwise comparison of the `points` marker pass. Line
 * and area share it - area's null stroke / fill / color fields compare
 * equal, so one comparator covers both without a per-atom near-copy.
 * Extending (not dropping) the comparator keeps the array field under a
 * working `equal`; an array computed without one cascades on every
 * rebuild.
 *
 * @internal
 */
export function lineAreaGeomEqual(a: LayerGeometry, b: LayerGeometry): boolean {
  if (a === b) {
    return true;
  }
  if ((a.kind !== 'line' && a.kind !== 'area') || (b.kind !== 'line' && b.kind !== 'area')) {
    return false;
  }
  return (
    a.d === b.d &&
    a.color === b.color &&
    a.strokeWidth === b.strokeWidth &&
    a.fill === b.fill &&
    a.opacity === b.opacity &&
    pointsEqual(a.points, b.points)
  );
}

/**
 * Length-plus-elementwise equality for the optional `points` marker
 * pass. Absent and empty are equivalent.
 *
 * @internal
 */
export function pointsEqual(
  a: readonly PointMark[] | undefined,
  b: readonly PointMark[] | undefined,
): boolean {
  const ap = a ?? EMPTY_POINTS;
  const bp = b ?? EMPTY_POINTS;
  if (ap === bp) {
    return true;
  }
  if (ap.length !== bp.length) {
    return false;
  }
  for (let i = 0; i < ap.length; i++) {
    if (ap[i].cx !== bp[i].cx || ap[i].cy !== bp[i].cy) {
      return false;
    }
  }
  return true;
}
