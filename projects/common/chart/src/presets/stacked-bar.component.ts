import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import type { CngxAsyncState } from '@cngx/core/utils';
import { injectPresetState } from './preset-state';

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
    @switch (activeView()) {
      @case ('skeleton') {
        <span class="cngx-preset-skeleton" [attr.aria-busy]="true" [attr.aria-label]="i18n.loading()"></span>
      }
      @case ('empty') {
        <span class="cngx-preset-fallback">{{ i18n.empty() }}</span>
      }
      @case ('error') {
        <span class="cngx-preset-fallback cngx-preset-fallback--error">{{ i18n.error() }}</span>
      }
      @case ('none') {}
      @default {
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
      }
    }
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
      cngx-stacked-bar .cngx-preset-skeleton {
        display: block;
        height: var(--cngx-stacked-bar-height, 12px);
        background: var(--cngx-skeleton-bg, var(--cngx-chart-grid-color, rgb(0 0 0 / 0.08)));
        border-radius: var(--cngx-stacked-bar-radius, 6px);
      }
      cngx-stacked-bar .cngx-preset-fallback {
        display: inline-block;
        font-size: var(--cngx-preset-fallback-font-size, 0.75rem);
        opacity: var(--cngx-preset-fallback-opacity, 0.7);
      }
      cngx-stacked-bar .cngx-preset-fallback--error {
        color: var(--cngx-chart-danger, currentColor);
      }
    `,
  ],
})
export class CngxStackedBar {
  readonly segments = input.required<readonly CngxStackedSegment[]>();
  readonly total = input<number | null>(null);
  readonly state = input<CngxAsyncState<readonly CngxStackedSegment[]> | undefined>(undefined);
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  private readonly preset = injectPresetState(() => this.state());
  protected readonly i18n = this.preset.i18n;
  protected readonly activeView = this.preset.activeView;

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
