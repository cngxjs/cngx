import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

export interface CngxStackedSegment {
  readonly value: number;
  readonly color?: string;
  readonly label: string;
}

interface SegmentRendering {
  readonly key: string;
  readonly left: number;
  readonly width: number;
  readonly color: string | null;
  readonly label: string;
  readonly value: number;
}

/**
 * Single-bar stacked composition — visualises proportional shares of
 * a fixed total. Pure DOM, no SVG. Host carries `role="img"` because
 * a stacked bar communicates a multi-segment ratio, not a single
 * bounded reading; the SR description enumerates segments via the
 * auto-generated `aria-label` (or the `[ariaLabel]` override).
 */
@Component({
  selector: 'cngx-stacked-bar',
  exportAs: 'cngxStackedBar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    role: 'img',
    '[attr.aria-label]': 'effectiveAriaLabel()',
    class: 'cngx-stacked-bar',
  },
  template: `
    <div class="cngx-stacked-bar__track">
      @for (s of segmentRenderings(); track s.key) {
        <div
          class="cngx-stacked-bar__segment"
          [style.left.%]="s.left"
          [style.width.%]="s.width"
          [style.background]="s.color"
          [attr.title]="s.label + ': ' + s.value"
          [attr.aria-hidden]="true"
        ></div>
      }
    </div>
  `,
  styles: [
    `
      cngx-stacked-bar {
        display: block;
        width: var(--cngx-stacked-bar-width, 200px);
      }
      cngx-stacked-bar .cngx-stacked-bar__track {
        position: relative;
        height: var(--cngx-stacked-bar-height, 12px);
        background: var(--cngx-stacked-bar-track, var(--cngx-chart-grid-color, rgb(0 0 0 / 0.05)));
        border-radius: var(--cngx-stacked-bar-radius, 6px);
        overflow: hidden;
      }
      cngx-stacked-bar .cngx-stacked-bar__segment {
        position: absolute;
        top: 0;
        bottom: 0;
        background: var(--cngx-stacked-bar-segment-color, var(--cngx-chart-primary, currentColor));
        transition: width var(--cngx-stacked-bar-transition, 240ms) ease-out,
          left var(--cngx-stacked-bar-transition, 240ms) ease-out;
      }
    `,
  ],
})
export class CngxStackedBar {
  readonly segments = input.required<readonly CngxStackedSegment[]>();
  readonly total = input<number | null>(null);
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  protected readonly resolvedTotal = computed(() => {
    const explicit = this.total();
    if (explicit !== null && explicit > 0) {
      return explicit;
    }
    let sum = 0;
    for (const s of this.segments()) {
      sum += s.value;
    }
    return sum > 0 ? sum : 1;
  });

  protected readonly segmentRenderings = computed<readonly SegmentRendering[]>(() => {
    const total = this.resolvedTotal();
    let runningLeft = 0;
    return this.segments().map((s, i) => {
      const width = (s.value / total) * 100;
      const left = runningLeft;
      runningLeft += width;
      return {
        key: `${i}-${s.label}`,
        left,
        width,
        color: s.color ?? null,
        label: s.label,
        value: s.value,
      };
    });
  });

  protected readonly effectiveAriaLabel = computed(() => {
    const explicit = this.ariaLabel();
    if (explicit !== null && explicit !== '') {
      return explicit;
    }
    const segments = this.segments();
    if (segments.length === 0) {
      return 'Empty stacked bar';
    }
    const total = this.resolvedTotal();
    const parts = segments.map((s) => `${s.label}: ${s.value}`);
    return `Total ${total}. ${parts.join(', ')}.`;
  });
}
