import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { injectChartContext, type XScaleInput } from '../chart/chart-context';

/**
 * Reads the data-space X value of a scatter row at index `i`.
 *
 * @category common/chart/layers
 */
export type ScatterXAccessor<T> = (d: T, i: number) => XScaleInput;
/**
 * Reads the data-space Y value of a scatter row at index `i`.
 *
 * @category common/chart/layers
 */
export type ScatterYAccessor<T> = (d: T, i: number) => number;

/** @internal */
interface ScatterCircle {
  readonly key: number;
  readonly cx: number;
  readonly cy: number;
}

/**
 * Scatter layer atom. Renders one `<circle>` per datapoint. X and Y
 * accessors are independent - neither defaults to index, since the
 * defining trait of a scatter chart is two genuine data dimensions.
 *
 * Attribute-selector on `<svg:g>` - see {@link CngxLine} for why.
 *
 * @category common/chart/layers
 * @docsKind primary
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/layers/scatter.component.ts
 * @since 0.1.0
 * @relatedTo CngxLine, CngxBar, CngxArea, CngxChart
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
  selector: '[cngxScatter]',
  exportAs: 'cngxScatter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (c of circles(); track c.key) {
      <svg:circle class="cngx-scatter" [attr.cx]="c.cx" [attr.cy]="c.cy" [attr.r]="radius()" />
    }
  `,
  styles: [
    `
      .cngx-scatter {
        fill: var(--cngx-scatter-color, var(--cngx-chart-primary, currentColor));
        transform-origin: 50% 50%;
        transform-box: fill-box;
        animation: cngx-scatter-enter var(--cngx-chart-enter-duration, 480ms)
          var(--cngx-chart-enter-easing, cubic-bezier(0.34, 1.56, 0.64, 1)) backwards;
      }
      @keyframes cngx-scatter-enter {
        from {
          transform: scale(0);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .cngx-scatter {
          animation: none;
        }
      }
    `,
  ],
})
export class CngxScatter<T = unknown> {
  readonly x = input.required<ScatterXAccessor<T>>();
  readonly y = input.required<ScatterYAccessor<T>>();
  readonly radius = input<number>(3);
  readonly data = input<readonly T[] | undefined>(undefined);

  private readonly ctx = injectChartContext('CngxScatter');

  private readonly resolvedData = computed<readonly T[]>(() => {
    const local = this.data();
    if (local !== undefined) {
      return local;
    }
    return this.ctx.data<T>();
  });

  protected readonly circles = computed<readonly ScatterCircle[]>(
    () => {
      const data = this.resolvedData();
      const xScale = this.ctx.xScale();
      const yScale = this.ctx.yScale();
      const xAcc = this.x();
      const yAcc = this.y();
      const out = new Array<ScatterCircle>(data.length);
      for (let i = 0; i < data.length; i++) {
        out[i] = {
          key: i,
          cx: xScale(xAcc(data[i], i)),
          cy: yScale(yAcc(data[i], i)),
        };
      }
      return out;
    },
    { equal: circlesEqual },
  );
}

/** @internal */
function circlesEqual(a: readonly ScatterCircle[], b: readonly ScatterCircle[]): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i].cx !== b[i].cx || a[i].cy !== b[i].cy) {
      return false;
    }
  }
  return true;
}
