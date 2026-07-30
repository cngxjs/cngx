import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { injectChartContext } from '../chart/chart-context';
import { CNGX_CHART_LAYER, type CngxChartLayer, type LayerGeometry } from './chart-layer';
import { type CngxCurve } from '../path/curve';
import {
  createPathBuilder,
  type LineXAccessor,
  type LineYAccessor,
  type PathBuilder,
} from '../path/path-builder';

/**
 * Area layer atom. Reuses {@link createPathBuilder} for the upper edge
 * (same compute guard as `[cngxLine]`) and closes the polygon to a
 * `[baseline]` (default `0`) so SVG can fill it.
 *
 * Attribute-selector on `<svg:g>` — see {@link CngxLine} for why.
 *
 * The `d` string is cascade-guarded with string equality on its
 * `computed` so a no-op data refresh does not force a fill repaint.
 *
 * A single-datum area closes on itself at one x and covers no pixels,
 * so a series shorter than two points paints a point marker instead of
 * nothing. `[points]` mirrors {@link CngxLine}: `'auto'` (default) marks
 * only the one-datum case, `'always'` every datum, `'never'` none.
 *
 * @category common/chart/layers
 * @docsKind primary
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/layers/area.component.ts
 * @since 0.1.0
 * @relatedTo CngxLine, CngxBand, CngxThreshold, CngxChart
 *
 * <example-url>http://localhost:4200/#/common/chart/primitives/async-state-machine-on-the-primitive</example-url>
 * <example-url>http://localhost:4200/#/common/chart/primitives/combo-bars-moving-average-line</example-url>
 * <example-url>http://localhost:4200/#/common/chart/primitives/line-area-threshold-band</example-url>
 * <example-url>http://localhost:4200/#/common/chart/primitives/multi-series-line-axis-labels-legend</example-url>
 * <example-url>http://localhost:4200/#/common/chart/primitives/responsive-fills-parent-width</example-url>
 * <example-url>http://localhost:4200/#/common/chart/primitives/scatter-with-performance-zones</example-url>
 * <example-url>http://localhost:4200/#/common/chart/primitives/time-series-with-threshold-zones</example-url>
 */
@Component({
  selector: '[cngxArea]',
  exportAs: 'cngxArea',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: CNGX_CHART_LAYER, useExisting: CngxArea }],
  template: `
    @if (ctx.renderSvg()) {
      <svg:path
        class="cngx-area"
        [attr.d]="d()"
        [attr.fill-opacity]="opacity()"
      />
      @for (p of pointMarks(); track $index) {
        <svg:circle class="cngx-area__point" [attr.cx]="p.cx" [attr.cy]="p.cy" />
      }
    }
  `,
  styles: [
    `
      .cngx-area {
        fill: var(--cngx-area-fill, var(--cngx-chart-primary, currentColor));
        fill-opacity: var(--cngx-area-opacity, 0.18);
        stroke: none;
        animation: cngx-area-enter var(--cngx-chart-enter-duration, 480ms)
          var(--cngx-chart-enter-easing, cubic-bezier(0.4, 0, 0.2, 1));
      }
      @keyframes cngx-area-enter {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .cngx-area__point {
        r: var(--cngx-area-point-radius, 3px);
        fill: var(--cngx-area-fill, var(--cngx-chart-primary, currentColor));
        animation: cngx-area-enter var(--cngx-chart-enter-duration, 480ms)
          var(--cngx-chart-enter-easing, cubic-bezier(0.4, 0, 0.2, 1));
      }
      @media (prefers-reduced-motion: reduce) {
        .cngx-area,
        .cngx-area__point { animation: none; }
      }
    `,
  ],
})
export class CngxArea<T = unknown> implements CngxChartLayer {
  readonly accessor = input<LineYAccessor<T>>((d: T) => Number(d));
  readonly xAccessor = input<LineXAccessor<T> | undefined>(undefined);
  readonly opacity = input<number | string | null>(null);
  readonly curve = input<CngxCurve>('linear');
  readonly baseline = input<number>(0);
  readonly data = input<readonly T[] | undefined>(undefined);

  /**
   * Point-marker mode, mirroring {@link CngxLine}. `'auto'` (default)
   * draws a marker only for a single-datum series - an area closed on
   * itself at one x covers no pixels and paints nothing otherwise.
   * `'always'` marks every datum; `'never'` suppresses markers.
   */
  readonly points = input<'auto' | 'always' | 'never'>('auto');

  protected readonly ctx = injectChartContext('CngxArea');

  private readonly builder = computed<PathBuilder<T>>(() =>
    createPathBuilder<T>({
      y: this.accessor(),
      x: this.xAccessor(),
      curve: this.curve(),
    }),
  );

  private readonly resolvedData = computed<readonly T[]>(() => {
    const local = this.data();
    if (local !== undefined) {
      return local;
    }
    return this.ctx.data<T>();
  });

  protected readonly d = computed<string>(
    () => {
      const data = this.resolvedData();
      if (data.length === 0) {
        return '';
      }
      const xScale = this.ctx.xScale();
      const yScale = this.ctx.yScale();
      const upper = this.builder().build(data, xScale, yScale);
      const baselineY = yScale(this.baseline());
      const xAcc = this.xAccessor() ?? ((_: T, i: number) => i);
      const lastX = xScale(xAcc(data[data.length - 1], data.length - 1));
      const firstX = xScale(xAcc(data[0], 0));
      return `${upper} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;
    },
    { equal: (a, b) => a === b },
  );

  readonly geometry = computed<LayerGeometry>(
    () => {
      const op = this.opacity();
      const mode = this.points();
      const data = this.resolvedData();
      const draw = mode === 'always' || (mode === 'auto' && data.length === 1);
      let marks: readonly PointMark[] = EMPTY_POINTS;
      if (draw && data.length > 0) {
        const xScale = this.ctx.xScale();
        const yScale = this.ctx.yScale();
        const yAcc = this.accessor();
        const xAcc = this.xAccessor() ?? ((_: T, i: number) => i);
        const out = new Array<PointMark>(data.length);
        for (let i = 0; i < data.length; i++) {
          out[i] = { cx: xScale(xAcc(data[i], i)), cy: yScale(yAcc(data[i], i)) };
        }
        marks = out;
      }
      return {
        kind: 'area',
        d: this.d(),
        color: null,
        strokeWidth: null,
        fill: null,
        opacity: op == null ? null : Number(op),
        points: marks,
      };
    },
    { equal: areaGeomEqual },
  );

  /**
   * Template view of the geometry's marker pass. Forwards the reference
   * the `geometry` computed already holds - `areaGeomEqual` keeps it
   * stable across a no-op refresh, so no second equality guard is needed.
   */
  protected readonly pointMarks = computed<readonly PointMark[]>(() => {
    const g = this.geometry();
    return g.kind === 'area' ? (g.points ?? EMPTY_POINTS) : EMPTY_POINTS;
  });
}

/** @internal Scale-projected centre of a single point marker. */
interface PointMark {
  readonly cx: number;
  readonly cy: number;
}

/** @internal Shared stable empty-marks reference. */
const EMPTY_POINTS: readonly PointMark[] = [];

/**
 * Structural equality for area geometry: `d` string, the numeric fill
 * opacity, and a length-plus-elementwise comparison of the `points`
 * marker pass. Extending the comparator rather than dropping it keeps
 * the new array field under the existing guard - an array computed
 * without a working `equal` cascades on every rebuild.
 *
 * @internal
 */
function areaGeomEqual(a: LayerGeometry, b: LayerGeometry): boolean {
  if (a === b) {
    return true;
  }
  if (a.kind !== 'area' || b.kind !== 'area') {
    return false;
  }
  return a.d === b.d && a.opacity === b.opacity && pointsEqual(a.points, b.points);
}

/**
 * Length-plus-elementwise equality for the optional `points` marker
 * pass. Absent and empty are equivalent.
 *
 * @internal
 */
function pointsEqual(
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

