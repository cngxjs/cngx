import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { injectChartContext } from '../chart/chart-context';

/**
 * Band reference atom. Renders a `<rect>` across a vertical Y-range
 * (`from..to`) spanning the chart's full width. Use to highlight a
 * value range (e.g. "good zone", "watch zone") behind primary layers.
 *
 * Default opacity is low (`var(--cngx-band-opacity, 0.12)`) so the
 * band sits behind line / area / bar layers without dominating.
 *
 * Attribute-selector on `<svg:g>` — see {@link CngxLine} for why.
 */
@Component({
  selector: '[cngxBand]',
  exportAs: 'cngxBand',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (rect(); as r) {
      <svg:rect
        class="cngx-band__rect"
        [attr.x]="0"
        [attr.y]="r.y"
        [attr.width]="r.width"
        [attr.height]="r.height"
        [attr.fill-opacity]="opacity()"
      />
      @if (label(); as l) {
        <svg:text
          class="cngx-band__label"
          [attr.x]="4"
          [attr.y]="r.y + r.height / 2"
          text-anchor="start"
          dominant-baseline="middle"
        >
          {{ l }}
        </svg:text>
      }
    }
  `,
  styles: [
    `
      .cngx-band__rect {
        fill: var(--cngx-band-color, var(--cngx-chart-secondary, currentColor));
        fill-opacity: var(--cngx-band-opacity, 0.12);
        stroke: none;
      }
      .cngx-band__label {
        fill: var(--cngx-band-text-color, var(--cngx-chart-text-color, currentColor));
        font-size: var(--cngx-band-font-size, 11px);
      }
    `,
  ],
})
export class CngxBand {
  readonly from = input.required<number>();
  readonly to = input.required<number>();
  readonly label = input<string | null>(null);
  readonly opacity = input<number | string | null>(null);

  private readonly ctx = injectChartContext('CngxBand');

  protected readonly rect = computed<{
    width: number;
    y: number;
    height: number;
  } | null>(
    () => {
      const { width, height } = this.ctx.dimensions();
      if (width <= 0 || height <= 0) {
        return null;
      }
      const yScale = this.ctx.yScale();
      const yA = yScale(this.from());
      const yB = yScale(this.to());
      const top = Math.min(yA, yB);
      const bottom = Math.max(yA, yB);
      return { width, y: top, height: bottom - top };
    },
    {
      equal: (a, b) =>
        a === b ||
        (a !== null &&
          b !== null &&
          a.width === b.width &&
          a.y === b.y &&
          a.height === b.height),
    },
  );
}

