import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

/**
 * Mini horizontal bar — a single-value bounded indicator. Renders
 * pure DOM (no SVG), positioned with CSS only. Host carries
 * `role="meter"` per the WAI-ARIA pattern for single-value bounded
 * indicators; `aria-valuenow` / `aria-valuemin` / `aria-valuemax`
 * tell AT the exact reading without a separate Summary.
 */
@Component({
  selector: 'cngx-mini-bar',
  exportAs: 'cngxMiniBar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    role: 'meter',
    '[attr.aria-valuenow]': 'value()',
    '[attr.aria-valuemin]': 'min()',
    '[attr.aria-valuemax]': 'max()',
    '[attr.aria-label]': 'ariaLabel()',
    class: 'cngx-mini-bar',
  },
  template: `
    <div class="cngx-mini-bar__track">
      <div class="cngx-mini-bar__fill" [style.width.%]="percent()"></div>
    </div>
  `,
  styles: [
    `
      cngx-mini-bar {
        display: inline-block;
        width: var(--cngx-mini-bar-width, 80px);
        --cngx-mini-bar-color: var(--cngx-bar-color, var(--cngx-chart-primary, currentColor));
      }
      cngx-mini-bar .cngx-mini-bar__track {
        position: relative;
        height: var(--cngx-mini-bar-height, 6px);
        background: var(--cngx-mini-bar-track, var(--cngx-chart-grid-color, rgb(0 0 0 / 0.08)));
        border-radius: var(--cngx-mini-bar-radius, 3px);
        overflow: hidden;
      }
      cngx-mini-bar .cngx-mini-bar__fill {
        height: 100%;
        background: var(--cngx-mini-bar-color);
        border-radius: inherit;
        transition: width var(--cngx-mini-bar-transition, 240ms) ease-out;
      }
    `,
  ],
})
export class CngxMiniBar {
  readonly value = input.required<number>();
  readonly max = input<number>(100);
  readonly min = input<number>(0);
  readonly label = input<string | null>(null);
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  protected readonly percent = computed(() => {
    const v = this.value();
    const lo = this.min();
    const hi = this.max();
    if (hi === lo) {
      return 0;
    }
    const ratio = ((v - lo) / (hi - lo)) * 100;
    if (ratio < 0) {
      return 0;
    }
    if (ratio > 100) {
      return 100;
    }
    return ratio;
  });
}
