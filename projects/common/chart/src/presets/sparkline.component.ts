import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { CngxChart } from '../chart/chart.component';
import { CngxAxis } from '../axis/axis.component';
import { CngxLine } from '../layers/line.component';
import { CngxArea } from '../layers/area.component';

/**
 * Inline sparkline — a tiny line chart for KPI cards and dashboard
 * tiles. Composes `<cngx-chart>` + `<cngx-line>` (+ optional
 * `<cngx-area>`) with hidden axes that publish the scale domain
 * derived from the `data` array.
 *
 * Default viewBox is 80×24, intended for inline placement next to a
 * label or numeric value. Theming via `--cngx-sparkline-color`
 * (atom-local) → `--cngx-chart-primary` (chart-level) cascade.
 *
 * The host carries `role="img"` and a reactive `aria-label` derived
 * from the chart's auto-Summary; consumers can override via
 * `[ariaLabel]`.
 */
@Component({
  selector: 'cngx-sparkline',
  exportAs: 'cngxSparkline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxChart, CngxAxis, CngxLine, CngxArea],
  host: { class: 'cngx-sparkline' },
  template: `
    <cngx-chart
      [data]="data()"
      [width]="width()"
      [height]="height()"
      [aria-label]="ariaLabel()"
    >
      <cngx-axis position="bottom" type="linear" [domain]="xDomain()" />
      <cngx-axis position="left" type="linear" [domain]="yDomain()" />
      @if (showArea()) {
        <cngx-area />
      }
      <cngx-line [strokeWidth]="strokeWidth()" />
    </cngx-chart>
  `,
  styles: [
    `
      cngx-sparkline {
        display: inline-block;
        line-height: 0;
        --cngx-line-color: var(--cngx-sparkline-color, var(--cngx-chart-primary, currentColor));
        --cngx-area-fill: var(--cngx-sparkline-color, var(--cngx-chart-primary, currentColor));
      }
      cngx-sparkline cngx-axis {
        display: none;
      }
    `,
  ],
})
export class CngxSparkline {
  readonly data = input.required<readonly number[]>();
  readonly width = input<number>(80);
  readonly height = input<number>(24);
  readonly strokeWidth = input<number | string | null>(null);
  readonly showArea = input<boolean>(false);
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  protected readonly xDomain = computed<readonly number[]>(() => {
    const n = this.data().length;
    return n < 2 ? [0, 1] : [0, n - 1];
  });

  protected readonly yDomain = computed<readonly number[]>(() => {
    const d = this.data();
    if (d.length === 0) {
      return [0, 1];
    }
    let min = d[0];
    let max = d[0];
    for (let i = 1; i < d.length; i++) {
      const v = d[i];
      if (v < min) {
        min = v;
      }
      if (v > max) {
        max = v;
      }
    }
    if (min === max) {
      return [min - 1, max + 1];
    }
    return [min, max];
  });
}
