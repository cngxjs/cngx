import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import type { CngxAsyncState } from '@cngx/core/utils';
import { CngxChart } from '../chart/chart.component';
import { CngxAxisDomain } from '../axis/axis-domain';
import { CngxArea } from '../layers/area.component';
import { sameNumberArr } from '../chart/equal-helpers';
import { presetIndexDomain, presetValueDomain } from '../chart/preset-math';
import { injectPresetState } from './preset-state';

/**
 * Inline mini area - a tiny filled-area chart for KPI cards. Sibling
 * of {@link CngxSparkline}; renders only the area (no line stroke).
 * Default viewBox 80×24. Theming via `--cngx-mini-area-color`
 * (atom-local) → `--cngx-chart-primary` (chart-level) cascade.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/presets/mini-area.component.ts
 * @since 0.1.0
 * @relatedTo CngxSparkline, CngxMiniBar, CngxChart
 *
 * <example-url>/#/common/chart/mini-area/async-state-machine</example-url>
 * <example-url>/#/common/chart/mini-area/inline-area-trends</example-url>
 * @axis level atom
 */
@Component({
  selector: 'cngx-mini-area',
  exportAs: 'cngxMiniArea',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxChart, CngxAxisDomain, CngxArea],
  host: {
    class: 'cngx-mini-area',
    '[attr.aria-busy]': 'busy() ? "true" : null',
  },
  template: `
    @switch (activeView()) {
      @case ('skeleton') {
        <span
          class="cngx-preset-skeleton"
          [style.width.px]="width()"
          [style.height.px]="height()"
          aria-hidden="true"
        ></span>
      }
      @case ('empty') {
        <span class="cngx-preset-fallback">{{ i18n().empty() }}</span>
      }
      @case ('error') {
        <span class="cngx-preset-fallback cngx-preset-fallback--error">{{ i18n().error() }}</span>
      }
      @case ('none') {}
      @default {
        <cngx-chart
          [data]="data()"
          [width]="width()"
          [height]="height()"
          [aria-label]="ariaLabel()"
        >
          <svg:g cngxAxisDomain position="bottom" type="linear" [domain]="xDomain()"></svg:g>
          <svg:g cngxAxisDomain position="left" type="linear" [domain]="yDomain()"></svg:g>
          <svg:g cngxArea [opacity]="opacity()" [baseline]="yDomain()[0]"></svg:g>
        </cngx-chart>
      }
    }
  `,
  styleUrls: ['../chart-tokens.css'],
  styles: [
    `
      cngx-mini-area {
        display: inline-block;
        line-height: 0;
        /**
         * Fill colour of the area layer inside the mini area. Derived from --cngx-mini-area-color.
         * @type <color>
         * @group Surface
         */
        --cngx-area-fill: var(--cngx-mini-area-color, var(--cngx-chart-primary, currentColor));
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
  /**
   * Required series of y values, drawn left to right at evenly spaced index positions. The vertical
   * scale spans the data minimum to maximum, padded by one unit either side when every value is
   * equal.
   */
  readonly data = input.required<readonly number[]>();
  /**
   * Width of the chart in px, also the width of the loading skeleton. Default `80`.
   */
  readonly width = input<number>(80);
  /**
   * Height of the chart in px, also the height of the loading skeleton. Default `24`.
   */
  readonly height = input<number>(24);
  /**
   * Fill opacity of the area, as a number or numeric string. Unset falls back to
   * `--cngx-area-opacity` (default `0.18`).
   */
  readonly opacity = input<number | string | null>(null);
  /**
   * Optional async state that picks the view: a skeleton with `aria-busy` on the host during the
   * first load, the built-in empty or error text after an empty or failed first load (copy from
   * `CNGX_CHART_I18N`), nothing while idle, the drawing otherwise. Only its status, first-load and
   * empty flags are read; the drawn values come from the preset's own inputs, and an unbound state
   * always draws.
   */
  readonly state = input<CngxAsyncState<readonly number[]> | undefined>(undefined);
  /**
   * Accessible name of the chart, bound as `[aria-label]`; replaces the summary the chart generates
   * from the data. Unset or empty keeps that generated summary.
   */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  private readonly preset = injectPresetState(() => this.state());
  protected readonly i18n = this.preset.i18n;
  protected readonly activeView = this.preset.activeView;

  /** True while the skeleton branch renders - the host announces busy, the span stays decorative. */
  protected readonly busy = computed(() => this.activeView() === 'skeleton');

  protected readonly xDomain = computed<readonly number[]>(
    () => presetIndexDomain(this.data().length),
    { equal: sameNumberArr },
  );

  protected readonly yDomain = computed<readonly number[]>(() => presetValueDomain(this.data()), {
    equal: sameNumberArr,
  });
}
