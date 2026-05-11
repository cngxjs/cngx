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
 */
@Component({
  selector: '[cngxLine]',
  exportAs: 'cngxLine',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <svg:path
      class="cngx-line"
      [attr.d]="d()"
      [attr.fill]="'none'"
      [attr.stroke]="color()"
      [attr.stroke-width]="strokeWidth()"
      [attr.stroke-linejoin]="'round'"
      [attr.stroke-linecap]="'round'"
    />
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
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @media (prefers-reduced-motion: reduce) {
        .cngx-line { animation: none; }
      }
    `,
  ],
})
export class CngxLine<T = unknown> {
  readonly accessor = input<LineYAccessor<T>>((d: T) => Number(d));
  readonly xAccessor = input<LineXAccessor<T> | undefined>(undefined);
  readonly color = input<string | null>(null);
  readonly strokeWidth = input<number | string | null>(null);
  readonly curve = input<CngxCurve>('linear');
  readonly data = input<readonly T[] | undefined>(undefined);

  private readonly ctx = injectChartContext('CngxLine');

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
}
