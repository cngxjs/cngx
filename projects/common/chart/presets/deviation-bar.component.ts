import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import type { CngxAsyncState } from '@cngx/core/utils';
import { clampedRatio } from './preset-math';
import { injectPresetState, warnIfUnnamedPreset } from './preset-state';

/**
 * Mini deviation bar - a single-value indicator that diverges from a
 * `[baseline]` (default `0`) in either direction. Negative deviations
 * render to the left of the baseline mark, positive to the right.
 * Pure DOM, no SVG. Host carries `role="meter"`.
 *
 * Use cases: budget variance ("$+45k over"), score deltas ("−12%
 * vs target"), KPI swing visualisations.
 *
 * @category common/chart/presets
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/presets/deviation-bar.component.ts
 * @since 0.1.0
 * @relatedTo CngxMiniBar, CngxBullet, CngxStackedBar
 *
 * <example-url>http://localhost:4200/#/common/chart/deviation-bar/async-state-machine</example-url>
 * <example-url>http://localhost:4200/#/common/chart/deviation-bar/variance-readings</example-url>
 */
@Component({
  selector: 'cngx-deviation-bar',
  exportAs: 'cngxDeviationBar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    role: 'meter',
    '[attr.aria-valuenow]': 'showsMeterValue() ? value() : null',
    '[attr.aria-valuemin]': 'showsMeterValue() ? minValue() : null',
    '[attr.aria-valuemax]': 'showsMeterValue() ? maxValue() : null',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-busy]': 'busy() ? "true" : null',
    class: 'cngx-deviation-bar',
  },
  template: `
    @switch (activeView()) {
      @case ('skeleton') {
        <span
          class="cngx-preset-skeleton"
          aria-hidden="true"
        ></span>
      }
      @case ('empty') {
        <span class="cngx-preset-fallback">{{ i18n.empty() }}</span>
      }
      @case ('error') {
        <span class="cngx-preset-fallback cngx-preset-fallback--error">{{ i18n.error() }}</span>
      }
      @case ('none') {}
      @default {
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
      }
    }
  `,
  styleUrls: ['../chart-tokens.css'],
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
        background: var(
          --cngx-deviation-bar-track,
          var(--cngx-chart-grid-color, rgb(0 0 0 / 0.08))
        );
        border-radius: var(--cngx-deviation-bar-radius, 3px);
        overflow: hidden;
      }
      cngx-deviation-bar .cngx-deviation-bar__baseline {
        position: absolute;
        left: 50%;
        top: 0;
        bottom: 0;
        width: 1px;
        background: var(
          --cngx-deviation-bar-baseline-color,
          var(--cngx-chart-axis-color, currentColor)
        );
        opacity: var(--cngx-deviation-bar-baseline-opacity, 0.5);
      }
      cngx-deviation-bar .cngx-deviation-bar__fill {
        position: absolute;
        top: 0;
        bottom: 0;
        transition:
          left var(--cngx-deviation-bar-transition, 240ms) ease-out,
          width var(--cngx-deviation-bar-transition, 240ms) ease-out;
      }
      cngx-deviation-bar .cngx-deviation-bar__fill--positive {
        background: var(--cngx-deviation-positive);
      }
      cngx-deviation-bar .cngx-deviation-bar__fill--negative {
        background: var(--cngx-deviation-negative);
      }
      cngx-deviation-bar .cngx-preset-skeleton {
        display: block;
        height: var(--cngx-deviation-bar-height, 6px);
        background: var(--cngx-skeleton-bg, var(--cngx-chart-grid-color, rgb(0 0 0 / 0.08)));
        border-radius: var(--cngx-deviation-bar-radius, 3px);
      }
      cngx-deviation-bar .cngx-preset-fallback {
        display: inline-block;
        font-size: var(--cngx-preset-fallback-font-size, 0.75rem);
        opacity: var(--cngx-preset-fallback-opacity, 0.7);
      }
      cngx-deviation-bar .cngx-preset-fallback--error {
        color: var(--cngx-chart-danger, currentColor);
      }
    `,
  ],
})
export class CngxDeviationBar {
  readonly value = input.required<number>();
  readonly baseline = input<number>(0);
  readonly magnitude = input<number>(100);
  readonly state = input<CngxAsyncState<number> | undefined>(undefined);
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  private readonly preset = injectPresetState(() => this.state());
  protected readonly i18n = this.preset.i18n;
  protected readonly activeView = this.preset.activeView;

  /** True while the skeleton branch renders - the host announces busy, the span stays decorative. */
  protected readonly busy = computed(() => this.activeView() === 'skeleton');

  /**
   * Meter value attributes render only in the content view: keeping
   * `aria-valuenow` while the skeleton or error fallback shows would
   * announce a stale reading for a value that is not on screen.
   */
  protected readonly showsMeterValue = computed(() => this.activeView() === 'content');

  constructor() {
    warnIfUnnamedPreset('cngx-deviation-bar', 'Bind [aria-label].', () => this.ariaLabel() !== null);
  }


  /**
   * The meter's valid range is centred on the baseline, not on zero:
   * a deviation bar with `[baseline]="100" [magnitude]="50"` reads
   * values in `[50, 150]`. Anchoring min/max at `±magnitude` alone
   * puts any non-zero-baseline reading outside its own declared range,
   * which is invalid meter semantics.
   */
  protected readonly minValue = computed(() => this.baseline() - this.magnitude());
  protected readonly maxValue = computed(() => this.baseline() + this.magnitude());

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
    const ratio = clampedRatio(Math.abs(delta), 0, m) * 50;
    if (positive) {
      return { positive, left: 50, width: ratio };
    }
    return { positive, left: 50 - ratio, width: ratio };
  });
}
