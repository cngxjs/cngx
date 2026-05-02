import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

/**
 * Mini deviation bar — a single-value indicator that diverges from a
 * `[baseline]` (default `0`) in either direction. Negative deviations
 * render to the left of the baseline mark, positive to the right.
 * Pure DOM, no SVG. Host carries `role="meter"`.
 *
 * Use cases: budget variance ("$+45k over"), score deltas ("−12%
 * vs target"), KPI swing visualisations.
 */
@Component({
  selector: 'cngx-deviation-bar',
  exportAs: 'cngxDeviationBar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    role: 'meter',
    '[attr.aria-valuenow]': 'value()',
    '[attr.aria-valuemin]': '-magnitude()',
    '[attr.aria-valuemax]': 'magnitude()',
    '[attr.aria-label]': 'ariaLabel()',
    class: 'cngx-deviation-bar',
  },
  template: `
    <div class="cngx-deviation-bar__track">
      <div class="cngx-deviation-bar__baseline"></div>
      @if (geometry(); as g) {
        <div
          class="cngx-deviation-bar__fill"
          [class.cngx-deviation-bar__fill--positive]="g.positive"
          [class.cngx-deviation-bar__fill--negative]="!g.positive"
          [style.left.%]="g.left"
          [style.width.%]="g.width"
        ></div>
      }
    </div>
  `,
  styles: [
    `
      cngx-deviation-bar {
        display: inline-block;
        width: var(--cngx-deviation-bar-width, 100px);
        --cngx-deviation-positive: var(--cngx-chart-success, #1f9d55);
        --cngx-deviation-negative: var(--cngx-chart-danger, #d2452f);
      }
      cngx-deviation-bar .cngx-deviation-bar__track {
        position: relative;
        height: var(--cngx-deviation-bar-height, 6px);
        background: var(--cngx-deviation-bar-track, var(--cngx-chart-grid-color, rgb(0 0 0 / 0.08)));
        border-radius: var(--cngx-deviation-bar-radius, 3px);
        overflow: hidden;
      }
      cngx-deviation-bar .cngx-deviation-bar__baseline {
        position: absolute;
        left: 50%;
        top: 0;
        bottom: 0;
        width: 1px;
        background: var(--cngx-deviation-bar-baseline-color, var(--cngx-chart-axis-color, currentColor));
        opacity: var(--cngx-deviation-bar-baseline-opacity, 0.5);
      }
      cngx-deviation-bar .cngx-deviation-bar__fill {
        position: absolute;
        top: 0;
        bottom: 0;
        transition: left var(--cngx-deviation-bar-transition, 240ms) ease-out,
          width var(--cngx-deviation-bar-transition, 240ms) ease-out;
      }
      cngx-deviation-bar .cngx-deviation-bar__fill--positive {
        background: var(--cngx-deviation-positive);
      }
      cngx-deviation-bar .cngx-deviation-bar__fill--negative {
        background: var(--cngx-deviation-negative);
      }
    `,
  ],
})
export class CngxDeviationBar {
  readonly value = input.required<number>();
  readonly baseline = input<number>(0);
  readonly magnitude = input<number>(100);
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  protected readonly geometry = computed<{
    positive: boolean;
    left: number;
    width: number;
  } | null>(() => {
    const v = this.value();
    const b = this.baseline();
    const m = this.magnitude();
    if (m <= 0) {
      return null;
    }
    const delta = v - b;
    if (delta === 0) {
      return null;
    }
    const positive = delta > 0;
    const ratio = Math.min(Math.abs(delta) / m, 1) * 50;
    if (positive) {
      return { positive, left: 50, width: ratio };
    }
    return { positive, left: 50 - ratio, width: ratio };
  });
}
