import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import type { CngxAsyncState } from '@cngx/core/utils';
import { CngxChart } from '../chart/chart.component';
import { CngxAxis } from '../axis/axis.component';
import { CngxLine } from '../layers/line.component';
import { CngxArea } from '../layers/area.component';
import { injectPresetState } from './preset-state';

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
    @switch (activeView()) {
      @case ('skeleton') {
        <span
          class="cngx-preset-skeleton"
          [style.width.px]="width()"
          [style.height.px]="height()"
          [attr.aria-busy]="true"
          [attr.aria-label]="i18n.loading()"
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
      }
    }
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
      cngx-sparkline .cngx-preset-skeleton {
        display: inline-block;
        background: var(--cngx-skeleton-bg, var(--cngx-chart-grid-color, rgb(0 0 0 / 0.08)));
        border-radius: var(--cngx-preset-skeleton-radius, 2px);
        animation: cngx-preset-shimmer 1.4s linear infinite;
        background-image: linear-gradient(
          90deg,
          transparent 0,
          var(--cngx-skeleton-shimmer, rgb(255 255 255 / 0.3)) 50%,
          transparent 100%
        );
        background-size: 200% 100%;
      }
      cngx-sparkline .cngx-preset-fallback {
        display: inline-block;
        font-size: var(--cngx-preset-fallback-font-size, 0.75rem);
        color: var(--cngx-chart-text-color, currentColor);
        opacity: var(--cngx-preset-fallback-opacity, 0.7);
      }
      cngx-sparkline .cngx-preset-fallback--error {
        color: var(--cngx-chart-danger, currentColor);
      }
      @keyframes cngx-preset-shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        cngx-sparkline .cngx-preset-skeleton {
          animation: none;
        }
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
  readonly state = input<CngxAsyncState<readonly number[]> | undefined>(undefined);
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  private readonly preset = injectPresetState(() => this.state());
  protected readonly i18n = this.preset.i18n;
  protected readonly activeView = this.preset.activeView;

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
