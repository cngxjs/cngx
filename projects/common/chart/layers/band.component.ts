import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { injectChartContext } from '../chart/chart-context';
import { CNGX_CHART_LAYER, type CngxChartLayer, type LayerGeometry } from './chart-layer';

/**
 * Band reference atom. Renders a `<rect>` across a vertical Y-range
 * (`from..to`) spanning the chart's full width. Use to highlight a
 * value range (e.g. "good zone", "watch zone") behind primary layers.
 *
 * Default opacity is low (`var(--cngx-band-opacity, 0.12)`) so the
 * band sits behind line / area / bar layers without dominating.
 *
 * Attribute-selector on `<svg:g>` — see {@link CngxLine} for why.
 *
 * @category common/chart/layers
 * @docsKind primary
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/layers/band.component.ts
 * @since 0.1.0
 * @relatedTo CngxThreshold, CngxArea, CngxChart
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
  selector: '[cngxBand]',
  exportAs: 'cngxBand',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: CNGX_CHART_LAYER, useExisting: CngxBand }],
  template: `
    @if (ctx.renderSvg()) {
      @if (rect(); as r) {
        <svg:rect
          class="cngx-band__rect"
          [attr.x]="0"
          [attr.y]="r.y"
          [attr.width]="r.width"
          [attr.height]="r.height"
          [attr.fill-opacity]="opacity()"
        />
        @if (label(); as l) {
          <svg:text
            class="cngx-band__label"
            [attr.x]="4"
            [attr.y]="r.y + r.height / 2"
            text-anchor="start"
            dominant-baseline="middle"
          >
            {{ l }}
          </svg:text>
        }
      }
    }
  `,
  styles: [
    `
      .cngx-band__rect {
        fill: var(--cngx-band-color, var(--cngx-chart-secondary, currentColor));
        fill-opacity: var(--cngx-band-opacity, 0.12);
        stroke: none;
        animation: cngx-band-enter var(--cngx-chart-enter-duration, 480ms)
          var(--cngx-chart-enter-easing, cubic-bezier(0.4, 0, 0.2, 1));
      }
      .cngx-band__label {
        fill: var(--cngx-band-text-color, var(--cngx-chart-text-color, currentColor));
        font-size: var(--cngx-band-font-size, 11px);
        animation: cngx-band-enter var(--cngx-chart-enter-duration, 480ms)
          var(--cngx-chart-enter-easing, cubic-bezier(0.4, 0, 0.2, 1));
      }
      @keyframes cngx-band-enter {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @media (prefers-reduced-motion: reduce) {
        .cngx-band__rect, .cngx-band__label { animation: none; }
      }
    `,
  ],
})
export class CngxBand implements CngxChartLayer {
  readonly from = input.required<number>();
  readonly to = input.required<number>();
  readonly label = input<string | null>(null);
  readonly opacity = input<number | string | null>(null);

  protected readonly ctx = injectChartContext('CngxBand');

  protected readonly rect = computed<{
    width: number;
    y: number;
    height: number;
  } | null>(
    () => {
      const { width, height } = this.ctx.dimensions();
      if (width <= 0 || height <= 0) {
        return null;
      }
      const yScale = this.ctx.yScale();
      const yA = yScale(this.from());
      const yB = yScale(this.to());
      const top = Math.min(yA, yB);
      const bottom = Math.max(yA, yB);
      return { width, y: top, height: bottom - top };
    },
    {
      equal: (a, b) =>
        a === b ||
        (a !== null &&
          b !== null &&
          a.width === b.width &&
          a.y === b.y &&
          a.height === b.height),
    },
  );

  readonly geometry = computed<LayerGeometry>(
    () => {
      const r = this.rect();
      const op = this.opacity();
      return {
        kind: 'band',
        x: 0,
        y: r?.y ?? 0,
        w: r?.width ?? 0,
        h: r?.height ?? 0,
        color: null,
        opacity: op == null ? null : Number(op),
      };
    },
    { equal: bandGeomEqual },
  );
}

/** @internal */
function bandGeomEqual(a: LayerGeometry, b: LayerGeometry): boolean {
  if (a === b) {
    return true;
  }
  if (a.kind !== 'band' || b.kind !== 'band') {
    return false;
  }
  return (
    a.x === b.x &&
    a.y === b.y &&
    a.w === b.w &&
    a.h === b.h &&
    a.color === b.color &&
    a.opacity === b.opacity
  );
}

