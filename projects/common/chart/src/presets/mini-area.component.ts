import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { CngxChart } from '../chart/chart.component';
import { CngxAxis } from '../axis/axis.component';
import { CngxArea } from '../layers/area.component';

/**
 * Inline mini area — a tiny filled-area chart for KPI cards. Sibling
 * of {@link CngxSparkline}; renders only the area (no line stroke).
 * Default viewBox 80×24. Theming via `--cngx-mini-area-color`
 * (atom-local) → `--cngx-chart-primary` (chart-level) cascade.
 */
@Component({
  selector: 'cngx-mini-area',
  exportAs: 'cngxMiniArea',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxChart, CngxAxis, CngxArea],
  host: { class: 'cngx-mini-area' },
  template: `
    <cngx-chart
      [data]="data()"
      [width]="width()"
      [height]="height()"
      [aria-label]="ariaLabel()"
    >
      <cngx-axis position="bottom" type="linear" [domain]="xDomain()" />
      <cngx-axis position="left" type="linear" [domain]="yDomain()" />
      <cngx-area [opacity]="opacity()" />
    </cngx-chart>
  `,
  styles: [
    `
      cngx-mini-area {
        display: inline-block;
        line-height: 0;
        --cngx-area-fill: var(--cngx-mini-area-color, var(--cngx-chart-primary, currentColor));
      }
      cngx-mini-area cngx-axis {
        display: none;
      }
    `,
  ],
})
export class CngxMiniArea {
  readonly data = input.required<readonly number[]>();
  readonly width = input<number>(80);
  readonly height = input<number>(24);
  readonly opacity = input<number | string | null>(null);
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
