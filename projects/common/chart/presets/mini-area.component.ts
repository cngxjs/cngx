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
import { CngxArea } from '../layers/area.component';
import { injectPresetState } from './preset-state';

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
          <svg:g cngxAxis position="bottom" type="linear" [domain]="xDomain()"></svg:g>
          <svg:g cngxAxis position="left" type="linear" [domain]="yDomain()"></svg:g>
          <svg:g cngxArea [opacity]="opacity()" [baseline]="yDomain()[0]"></svg:g>
        </cngx-chart>
      }
    }
  `,
  styles: [
    `
      cngx-mini-area {
        display: inline-block;
        line-height: 0;
        --cngx-area-fill: var(--cngx-mini-area-color, var(--cngx-chart-primary, currentColor));
      }
      cngx-mini-area [cngxAxis] {
        display: none;
      }
      cngx-mini-area .cngx-preset-skeleton {
        display: inline-block;
        background: var(--cngx-skeleton-bg, var(--cngx-chart-grid-color, rgb(0 0 0 / 0.08)));
        border-radius: var(--cngx-preset-skeleton-radius, 2px);
      }
      cngx-mini-area .cngx-preset-fallback {
        display: inline-block;
        line-height: normal;
        font-size: var(--cngx-preset-fallback-font-size, 0.75rem);
        opacity: var(--cngx-preset-fallback-opacity, 0.7);
      }
      cngx-mini-area .cngx-preset-fallback--error {
        color: var(--cngx-chart-danger, currentColor);
      }
    `,
  ],
})
export class CngxMiniArea {
  readonly data = input.required<readonly number[]>();
  readonly width = input<number>(80);
  readonly height = input<number>(24);
  readonly opacity = input<number | string | null>(null);
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
