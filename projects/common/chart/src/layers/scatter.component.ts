import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import {
  injectChartContext,
  type XScaleInput,
} from '../chart/chart-context';

export type ScatterXAccessor<T> = (d: T, i: number) => XScaleInput;
export type ScatterYAccessor<T> = (d: T, i: number) => number;

interface ScatterCircle {
  readonly key: number;
  readonly cx: number;
  readonly cy: number;
}

/**
 * Scatter layer atom. Renders one `<circle>` per datapoint. X and Y
 * accessors are independent — neither defaults to index, since the
 * defining trait of a scatter chart is two genuine data dimensions.
 *
 * Attribute-selector on `<svg:g>` — see {@link CngxLine} for why.
 */
@Component({
  selector: '[cngxScatter]',
  exportAs: 'cngxScatter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (c of circles(); track c.key) {
      <svg:circle
        class="cngx-scatter"
        [attr.cx]="c.cx"
        [attr.cy]="c.cy"
        [attr.r]="radius()"
      />
    }
  `,
  styles: [
    `
      .cngx-scatter {
        fill: var(--cngx-scatter-color, var(--cngx-chart-primary, currentColor));
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

