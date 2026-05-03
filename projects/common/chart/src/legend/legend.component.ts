import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

/**
 * Single legend entry. `color` is optional — when omitted the swatch
 * falls back to the chart-level primary token. `value` is intentionally
 * unconstrained so consumers can carry their domain key (id, layer
 * name, accessor return type, ...) for later interactions without a
 * second lookup.
 */
export interface CngxChartLegendItem<T = unknown> {
  readonly label: string;
  readonly color?: string | null;
  readonly value?: T;
}

/**
 * Presentational legend atom — a row (or column) of coloured swatches
 * paired with labels. Decoupled from `<cngx-chart>` and the layer
 * atoms by design: the consumer drives the items array, so the
 * legend stays a pure rendering surface with zero opinions about
 * series-discovery, visibility-toggling, or interaction.
 *
 * Compose alongside a chart wherever a multi-layer composition needs
 * a label key:
 *
 * ```html
 * <cngx-chart [data]="series">
 *   <svg:g cngxLine [data]="traffic" style="--cngx-line-color: #3b82f6"></svg:g>
 *   <svg:g cngxLine [data]="errors" style="--cngx-line-color: #d2452f"></svg:g>
 * </cngx-chart>
 * <cngx-chart-legend
 *   [items]="[
 *     { label: 'Traffic', color: '#3b82f6' },
 *     { label: 'Errors',  color: '#d2452f' }
 *   ]"
 * />
 * ```
 *
 * Theming via `--cngx-chart-legend-gap`,
 * `--cngx-chart-legend-swatch-size`, `--cngx-chart-legend-swatch-radius`,
 * `--cngx-chart-legend-font-size`. `[orientation]` flips between row
 * and column; `[align]` aligns along the main axis (`start`, `center`,
 * `end`).
 */
@Component({
  selector: 'cngx-chart-legend',
  exportAs: 'cngxChartLegend',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    role: 'list',
    class: 'cngx-chart-legend',
    '[class.cngx-chart-legend--vertical]': 'orientation() === "vertical"',
    '[style.justify-content]': 'flexAlign()',
  },
  template: `
    @for (item of items(); track $index) {
      <span class="cngx-chart-legend__item" role="listitem">
        <span
          class="cngx-chart-legend__swatch"
          [style.background]="item.color ?? null"
          aria-hidden="true"
        ></span>
        <span class="cngx-chart-legend__label">{{ item.label }}</span>
      </span>
    }
  `,
  styles: [
    `
      cngx-chart-legend {
        display: flex;
        flex-wrap: wrap;
        gap: var(--cngx-chart-legend-gap, 12px);
        font-size: var(--cngx-chart-legend-font-size, 0.8125rem);
        color: var(--cngx-chart-legend-color, var(--cngx-chart-text-color, currentColor));
        align-items: center;
      }
      cngx-chart-legend.cngx-chart-legend--vertical {
        flex-direction: column;
        align-items: flex-start;
      }
      cngx-chart-legend .cngx-chart-legend__item {
        display: inline-flex;
        align-items: center;
        gap: var(--cngx-chart-legend-item-gap, 6px);
      }
      cngx-chart-legend .cngx-chart-legend__swatch {
        display: inline-block;
        width: var(--cngx-chart-legend-swatch-size, 12px);
        height: var(--cngx-chart-legend-swatch-size, 12px);
        background: var(--cngx-chart-primary, currentColor);
        border-radius: var(--cngx-chart-legend-swatch-radius, 2px);
      }
    `,
  ],
})
export class CngxChartLegend<T = unknown> {
  readonly items = input.required<readonly CngxChartLegendItem<T>[]>();
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly align = input<'start' | 'center' | 'end'>('start');

  protected readonly flexAlign = computed(() => {
    switch (this.align()) {
      case 'center':
        return 'center';
      case 'end':
        return 'flex-end';
      default:
        return 'flex-start';
    }
  });
}
