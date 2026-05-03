/**
 * Curve interpolators for line / area path builders. Each function
 * returns the **interior** path commands that connect a series of
 * points; the caller is responsible for the leading `M` and any
 * trailing close commands.
 *
 * Pure TS, no DOM dependency, no Angular dep.
 */
export type CngxCurve = 'linear' | 'monotone';

export interface PathPoint {
  readonly x: number;
  readonly y: number;
}

/**
 * Build the SVG `d` attribute for a sequence of points.
 *
 * @param points Pixel-coordinate points to connect.
 * @param curve Interpolation strategy. `'linear'` joins points with
 *   straight `L` commands; `'monotone'` uses cubic Béziers with the
 *   monotone-X tangent rule (Fritsch-Carlson) so the curve never
 *   overshoots between data points.
 * @returns The full path data starting with `M`. Returns `''` when
 *   the input is empty; `M x y` when the input has one point.
 */
export function buildCurvePath(points: readonly PathPoint[], curve: CngxCurve): string {
  if (points.length === 0) {
    return '';
  }
  if (points.length === 1) {
    const p = points[0];
    return `M ${p.x} ${p.y}`;
  }
  if (curve === 'linear') {
    return buildLinearPath(points);
  }
  return buildMonotonePath(points);
}

function buildLinearPath(points: readonly PathPoint[]): string {
  const start = points[0];
  let out = `M ${start.x} ${start.y}`;
  for (let i = 1; i < points.length; i++) {
    out += ` L ${points[i].x} ${points[i].y}`;
  }
  return out;
}

/**
 * Monotone cubic Bézier interpolation (Fritsch-Carlson tangents on the
 * X dimension). Input points must have strictly increasing `x`
 * coordinates.
 */
function buildMonotonePath(points: readonly PathPoint[]): string {
  const n = points.length;
  const slopes = new Array<number>(n - 1);
  for (let i = 0; i < n - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    slopes[i] = dx === 0 ? 0 : (points[i + 1].y - points[i].y) / dx;
  }
  const tangents = new Array<number>(n);
  tangents[0] = slopes[0];
  tangents[n - 1] = slopes[n - 2];
  for (let i = 1; i < n - 1; i++) {
    const m1 = slopes[i - 1];
    const m2 = slopes[i];
    if (m1 * m2 <= 0) {
      tangents[i] = 0;
    } else {
      tangents[i] = (2 * m1 * m2) / (m1 + m2);
    }
  }
  let out = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const dx = p1.x - p0.x;
    const c1x = p0.x + dx / 3;
    const c1y = p0.y + (tangents[i] * dx) / 3;
    const c2x = p1.x - dx / 3;
    const c2y = p1.y - (tangents[i + 1] * dx) / 3;
    out += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p1.x} ${p1.y}`;
  }
  return out;
}
