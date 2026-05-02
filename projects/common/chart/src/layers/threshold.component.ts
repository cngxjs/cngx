import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { injectChartContext } from '../chart/chart-context';

/**
 * Threshold reference atom. Renders a single horizontal `<line>` at
 * `yScale(value)` spanning the chart's full width, plus an optional
 * `<text>` label at the right edge.
 *
 * Common use: target threshold ("budget cap"), warning bands, or any
 * "line at value" reference. Always reads scales from
 * {@link CNGX_CHART_CONTEXT}.
 */
@Component({
  selector: 'cngx-threshold',
  exportAs: 'cngxThreshold',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (geometry(); as g) {
      <svg:line
        class="cngx-threshold__line"
        [attr.x1]="0"
        [attr.y1]="g.y"
        [attr.x2]="g.width"
        [attr.y2]="g.y"
        [attr.stroke-dasharray]="dashed() ? '4 3' : null"
      />
      @if (label(); as l) {
        <svg:text
          class="cngx-threshold__label"
          [attr.x]="g.width - 4"
          [attr.y]="g.y - 4"
          text-anchor="end"
        >
          {{ l }}
        </svg:text>
      }
    }
  `,
  styles: [
    `
      .cngx-threshold__line {
        stroke: var(--cngx-threshold-color, var(--cngx-chart-danger, currentColor));
        stroke-width: var(--cngx-threshold-stroke-width, 1px);
        fill: none;
      }
      .cngx-threshold__label {
        fill: var(--cngx-threshold-text-color, var(--cngx-chart-danger, currentColor));
        font-size: var(--cngx-threshold-font-size, 11px);
      }
    `,
  ],
})
export class CngxThreshold {
  readonly value = input.required<number>();
  readonly label = input<string | null>(null);
  readonly dashed = input<boolean>(false);

  private readonly ctx = injectChartContext('CngxThreshold');

  protected readonly geometry = computed<{ width: number; y: number } | null>(() => {
    const { width, height } = this.ctx.dimensions();
    if (width <= 0 || height <= 0) {
      return null;
    }
    const y = this.ctx.yScale()(this.value());
    return { width, y };
  });
}

