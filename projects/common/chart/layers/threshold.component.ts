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
 * Threshold reference atom. Renders a single horizontal `<line>` at
 * `yScale(value)` spanning the chart's full width, plus an optional
 * `<text>` label at the right edge.
 *
 * Common use: target threshold ("budget cap"), warning bands, or any
 * "line at value" reference. Always reads scales from
 * {@link CNGX_CHART_CONTEXT}.
 *
 * Attribute-selector on `<svg:g>` - see {@link CngxLine} for why.
 *
 * @category common/chart/layers
 * @docsKind primary
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/layers/threshold.component.ts
 * @since 0.1.0
 * @relatedTo CngxBand, CngxChart, CngxLine
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
  selector: '[cngxThreshold]',
  exportAs: 'cngxThreshold',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: CNGX_CHART_LAYER, useExisting: CngxThreshold }],
  template: `
    @if (bounds(); as g) {
      @if (ctx.renderSvg()) {
        <svg:line
          class="cngx-threshold__line"
          [attr.x1]="g.x1"
          [attr.y1]="g.y"
          [attr.x2]="g.x2"
          [attr.y2]="g.y"
          [attr.stroke-dasharray]="dashed() ? '4 3' : null"
        />
      }
      <!--
        Outside the renderSvg gate on purpose: the canvas backend paints
        marks, never text, so gating the label on it would delete the
        label at the auto-switch threshold. Same split CngxAxis already
        makes - decoration stays SVG in both modes, only the
        volume-dependent geometry moves to canvas.
      -->
      @if (label(); as l) {
        <svg:text
          class="cngx-threshold__label"
          [attr.x]="g.x2 - 4"
          [attr.y]="g.y - 4"
          text-anchor="end"
        >
          {{ l }}
        </svg:text>
      }
    }
  `,
  styles: [
    `
      .cngx-threshold__line {
        stroke: var(--cngx-threshold-color, var(--cngx-chart-danger, currentColor));
        stroke-width: var(--cngx-threshold-stroke-width, 1px);
        fill: none;
        animation: cngx-threshold-enter var(--cngx-chart-enter-duration, 480ms)
          var(--cngx-chart-enter-easing, cubic-bezier(0.4, 0, 0.2, 1));
      }
      .cngx-threshold__label {
        fill: var(--cngx-threshold-text-color, var(--cngx-chart-danger, currentColor));
        font-size: var(--cngx-threshold-font-size, 11px);
        animation: cngx-threshold-enter var(--cngx-chart-enter-duration, 480ms)
          var(--cngx-chart-enter-easing, cubic-bezier(0.4, 0, 0.2, 1));
      }
      @keyframes cngx-threshold-enter {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .cngx-threshold__line,
        .cngx-threshold__label {
          animation: none;
        }
      }
    `,
  ],
})
export class CngxThreshold implements CngxChartLayer {
  readonly value = input.required<number>();
  readonly label = input<string | null>(null);
  readonly dashed = input<boolean>(false);

  protected readonly ctx = injectChartContext('CngxThreshold');

  protected readonly bounds = computed<{ x1: number; x2: number; y: number } | null>(
    () => {
      // Spans the plot, not the box - a threshold line running under
      // the left axis's tick labels reads as a stray rule through the
      // gutter rather than as a level on the chart.
      const { x0, x1, width, height } = this.ctx.plot();
      if (width <= 0 || height <= 0) {
        return null;
      }
      const y = this.ctx.yScale()(this.value());
      return { x1: x0, x2: x1, y };
    },
    {
      equal: (a, b) =>
        a === b || (a !== null && b !== null && a.x1 === b.x1 && a.x2 === b.x2 && a.y === b.y),
    },
  );

  readonly geometry = computed<LayerGeometry>(
    () => {
      const b = this.bounds();
      const y = b?.y ?? 0;
      return {
        kind: 'threshold',
        x1: b?.x1 ?? 0,
        y1: y,
        x2: b?.x2 ?? 0,
        y2: y,
        color: null,
        dashed: this.dashed(),
      };
    },
    { equal: thresholdGeomEqual },
  );
}

/** @internal */
function thresholdGeomEqual(a: LayerGeometry, b: LayerGeometry): boolean {
  if (a === b) {
    return true;
  }
  if (a.kind !== 'threshold' || b.kind !== 'threshold') {
    return false;
  }
  return (
    a.x1 === b.x1 &&
    a.y1 === b.y1 &&
    a.x2 === b.x2 &&
    a.y2 === b.y2 &&
    a.color === b.color &&
    a.dashed === b.dashed
  );
}
