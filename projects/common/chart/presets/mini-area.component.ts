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
 * @category common/chart/presets
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/chart/presets/mini-area.component.ts
 * @since 0.1.0
 * @relatedTo CngxSparkline, CngxMiniBar, CngxChart
 *
 * <example-url>http://localhost:4200/#/common/chart/mini-area/async-state-machine</example-url>
 * <example-url>http://localhost:4200/#/common/chart/mini-area/inline-area-trends</example-url>
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
  readonly data = input.required<readonly number[]>();
  readonly width = input<number>(80);
  readonly height = input<number>(24);
  readonly opacity = input<number | string | null>(null);
  readonly state = input<CngxAsyncState<readonly number[]> | undefined>(undefined);
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
