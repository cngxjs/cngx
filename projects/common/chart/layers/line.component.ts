import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { injectChartContext } from '../chart/chart-context';
import { CNGX_CHART_LAYER, type CngxChartLayer, type LayerGeometry } from './chart-layer';
import { derivePointMarks, EMPTY_POINTS, lineAreaGeomEqual, type PointMark } from './point-geom';
import { type CngxCurve } from '../path/curve';
import {
  createPathBuilder,
  type LineXAccessor,
  type LineYAccessor,
  type PathBuilder,
} from '../path/path-builder';

/**
 * Line layer atom. Renders a single SVG `<path>` connecting the data
 * points projected through the parent chart's scales. Reads scales
 * from {@link CNGX_CHART_CONTEXT}, NOT from a parent class.
 *
 * Attribute-selector on `<svg:g>` — the host element IS the SVG group.
 * Element selectors create XHTML-namespaced custom elements inside
 * SVG, which break layout for the namespaced children. Apply this
 * directive on an `<svg:g>` host instead.
 *
 * The `d` string is cascade-guarded with string equality on its
 * `computed` so downstream effects only re-run when the path
 * geometry actually changes. The `createPathBuilder` cache provides
 * the **compute guard** — same `(data, xScale, yScale)` triple by
 * reference skips the per-datapoint projection work.
 *
 * A single-point series draws no visible path (`M x y` has no length),
 * so a series shorter than two points paints a point marker instead of
 * nothing. `[points]` controls this: `'auto'` (default) marks only the
 * one-datum case, `'always'` marks every datum, `'never'` suppresses it.
 *
 * @category common/chart/layers
 * @docsKind primary
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/layers/line.component.ts
 * @since 0.1.0
 * @relatedTo CngxArea, CngxScatter, CngxBar, CngxChart
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
  selector: '[cngxLine]',
  exportAs: 'cngxLine',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: CNGX_CHART_LAYER, useExisting: CngxLine }],
  template: `
    @if (ctx.renderSvg()) {
      <svg:path
        class="cngx-line"
        [attr.d]="d()"
        [attr.fill]="'none'"
        [attr.stroke]="color()"
        [attr.stroke-width]="strokeWidth()"
        [attr.stroke-linejoin]="'round'"
        [attr.stroke-linecap]="'round'"
      />
      @for (p of pointMarks(); track $index) {
        <svg:circle class="cngx-line__point" [attr.cx]="p.cx" [attr.cy]="p.cy" />
      }
    }
  `,
  styles: [
    `
      .cngx-line {
        stroke: var(--cngx-line-color, var(--cngx-chart-primary, currentColor));
        stroke-width: var(--cngx-line-stroke-width, 1.5px);
        animation: cngx-line-enter var(--cngx-chart-enter-duration, 480ms)
          var(--cngx-chart-enter-easing, cubic-bezier(0.4, 0, 0.2, 1));
      }
      @keyframes cngx-line-enter {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      .cngx-line__point {
        r: var(--cngx-line-point-radius, 3px);
        fill: var(--cngx-line-color, var(--cngx-chart-primary, currentColor));
        animation: cngx-line-enter var(--cngx-chart-enter-duration, 480ms)
          var(--cngx-chart-enter-easing, cubic-bezier(0.4, 0, 0.2, 1));
      }
      @media (prefers-reduced-motion: reduce) {
        .cngx-line,
        .cngx-line__point {
          animation: none;
        }
      }
    `,
  ],
})
export class CngxLine<T = unknown> implements CngxChartLayer {
  readonly accessor = input<LineYAccessor<T>>((d: T) => Number(d));
  readonly xAccessor = input<LineXAccessor<T> | undefined>(undefined);
  readonly color = input<string | null>(null);
  readonly strokeWidth = input<number | string | null>(null);
  readonly curve = input<CngxCurve>('linear');
  readonly data = input<readonly T[] | undefined>(undefined);

  /**
   * Point-marker mode. `'auto'` (default) draws a marker only when the
   * resolved series has exactly one datum - the frame a warming buffer
   * passes through on every reload, which paints nothing otherwise.
   * `'always'` marks every datum; `'never'` suppresses markers.
   */
  readonly points = input<'auto' | 'always' | 'never'>('auto');

  protected readonly ctx = injectChartContext('CngxLine');

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
    () => this.builder().build(this.resolvedData(), this.ctx.xScale(), this.ctx.yScale()),
    { equal: (a, b) => a === b },
  );

  readonly geometry = computed<LayerGeometry>(
    () => ({
      kind: 'line',
      d: this.d(),
      color: this.color(),
      strokeWidth: this.strokeWidth(),
      fill: 'none',
      points: derivePointMarks(
        this.points(),
        this.resolvedData(),
        this.ctx.xScale(),
        this.ctx.yScale(),
        this.accessor(),
        this.xAccessor() ?? ((_: T, i: number) => i),
      ),
    }),
    { equal: lineAreaGeomEqual },
  );

  /**
   * Template view of the geometry's marker pass. Forwards the array
   * reference the `geometry` computed already holds - `lineAreaGeomEqual`
   * keeps that reference stable across a no-op refresh, so this
   * projection stays stable too without a second equality guard.
   */
  protected readonly pointMarks = computed<readonly PointMark[]>(() => {
    const g = this.geometry();
    return g.kind === 'line' ? (g.points ?? EMPTY_POINTS) : EMPTY_POINTS;
  });
}
