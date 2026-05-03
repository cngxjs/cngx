import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { injectChartContext } from '../chart/chart-context';
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
 */
@Component({
  selector: '[cngxArea]',
  exportAs: 'cngxArea',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <svg:path
      class="cngx-area"
      [attr.d]="d()"
      [attr.fill-opacity]="opacity()"
    />
  `,
  styles: [
    `
      .cngx-area {
        fill: var(--cngx-area-fill, var(--cngx-chart-primary, currentColor));
        fill-opacity: var(--cngx-area-opacity, 0.18);
        stroke: none;
      }
    `,
  ],
})
export class CngxArea<T = unknown> {
  readonly accessor = input<LineYAccessor<T>>((d: T) => Number(d));
  readonly xAccessor = input<LineXAccessor<T> | undefined>(undefined);
  readonly opacity = input<number | string | null>(null);
  readonly curve = input<CngxCurve>('linear');
  readonly baseline = input<number>(0);
  readonly data = input<readonly T[] | undefined>(undefined);

  private readonly ctx = injectChartContext('CngxArea');

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
}

