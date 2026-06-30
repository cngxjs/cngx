import { computed, Directive, ElementRef, inject, input, model } from '@angular/core';

import {
  CNGX_SLIDER_RANGE,
  type CngxSliderRangeHost,
  type CngxSliderThumbBounds,
  type CngxSliderThumbPosition,
} from './range-slider.token';

/**
 * Headless dual-thumb (range) slider brain. Put `cngxRangeSliderTrack` on your
 * own track container and host two {@link CngxSliderThumb} children
 * (`start` / `end`); the value is a `model<[number, number]>()` tuple this
 * directive owns. It provides {@link CNGX_SLIDER_RANGE} so each thumb reads the
 * shared config, learns its sibling-clamped bounds, and commits its end. The
 * thumbs cannot cross because {@link boundsFor} narrows each thumb's range to
 * the other thumb's current value - clamp math, not an effect (Pillar 1).
 *
 * Most consumers want the finished {@link CngxRangeSlider} component
 * (`<cngx-range-slider>`) which renders the track, fill band, and both thumbs
 * and uses this directive as its brain. Reach for `cngxRangeSliderTrack` only
 * when you want to own the skin markup.
 *
 * ```html
 * <div cngxRangeSliderTrack role="group" aria-label="Price range" [(value)]="price" [min]="0" [max]="1000">
 *   <span class="cngx-slider__track"></span>
 *   <span cngxSliderThumb="start" aria-label="Minimum"></span>
 *   <span cngxSliderThumb="end" aria-label="Maximum"></span>
 * </div>
 * ```
 *
 * @category common/interactive/slider
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/slider/range-slider.directive.ts
 * @since 0.1.0
 * @relatedTo CngxRangeSlider, CngxSliderThumb, createSliderCore
 */
@Directive({
  selector: '[cngxRangeSliderTrack]',
  exportAs: 'cngxRangeSliderTrack',
  standalone: true,
  providers: [{ provide: CNGX_SLIDER_RANGE, useExisting: CngxRangeSliderTrack }],
  host: {
    role: 'group',
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.aria-orientation]': 'orientation()',
    '[style.--cngx-slider-start-fraction]': 'startFraction()',
    '[style.--cngx-slider-end-fraction]': 'endFraction()',
  },
})
export class CngxRangeSliderTrack implements CngxSliderRangeHost {
  /** Two-way `[start, end]` tuple - the single source of truth for both thumbs. */
  readonly value = model<[number, number]>([0, 100]);
  /** Track lower bound. */
  readonly min = input<number>(0);
  /** Track upper bound. */
  readonly max = input<number>(100);
  /** Step granularity shared by both thumbs. */
  readonly step = input<number>(1);
  /**
   * Page-key jump size for both thumbs (absolute, not a step multiple).
   * Defaults to the larger of one step and a tenth of the range.
   */
  readonly largeStep = input<number | undefined>(undefined);
  /** Whether the range slider is disabled. */
  readonly disabled = input<boolean>(false);
  /** Track axis shared by both thumbs. */
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  /** Optional `aria-valuetext` formatter shared across both thumbs. */
  readonly valueText = input<((value: number) => string) | undefined>(undefined);

  // Sibling-clamp bounds. The start thumb's ceiling tracks the end value;
  // the end thumb's floor tracks the start value. Held as stable signals
  // (not recreated per boundsFor call) so each thumb's core reads one node.
  private readonly startBounds: CngxSliderThumbBounds = {
    min: this.min,
    max: computed(() => this.value()[1]),
  };
  private readonly endBounds: CngxSliderThumbBounds = {
    min: computed(() => this.value()[0]),
    max: this.max,
  };

  private readonly el = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;

  // Track fractions of each thumb, published as CSS vars so the skin can paint
  // a fill between them. Derived from the tuple - never synced (Pillar 1).
  readonly startFraction = computed(() => this.fractionOf(this.value()[0]));
  readonly endFraction = computed(() => this.fractionOf(this.value()[1]));

  private fractionOf(value: number): number {
    const span = this.max() - this.min();
    if (span <= 0) {
      return 0;
    }
    return Math.min(1, Math.max(0, (value - this.min()) / span));
  }

  boundsFor(position: CngxSliderThumbPosition): CngxSliderThumbBounds {
    return position === 'start' ? this.startBounds : this.endBounds;
  }

  commit(position: CngxSliderThumbPosition, value: number): void {
    const [start, end] = this.value();
    if (position === 'start') {
      if (value !== start) {
        this.value.set([value, end]);
      }
    } else if (value !== end) {
      this.value.set([start, value]);
    }
  }

  fractionFromPointer(clientX: number, clientY: number): number {
    const rect = this.el.getBoundingClientRect();
    const fraction =
      this.orientation() === 'vertical'
        ? rect.height > 0
          ? (rect.bottom - clientY) / rect.height
          : 0
        : rect.width > 0
          ? (clientX - rect.left) / rect.width
          : 0;
    return Math.min(1, Math.max(0, fraction));
  }
}
