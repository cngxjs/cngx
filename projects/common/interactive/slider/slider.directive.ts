import { computed, Directive, ElementRef, inject, input, model } from '@angular/core';

import { createSliderCore } from './slider-core';
import { createSliderInteraction, pointerFraction } from './slider-interaction';

/**
 * Headless single-thumb slider brain. Put `cngxSliderTrack` on your own track
 * element and the directive turns it into an APG-conformant `role="slider"`:
 * full keyboard (Arrow / Page / Home / End), pointer-drag with capture, and the
 * whole ARIA value surface (`aria-valuemin/max/now/valuetext/orientation`)
 * computed from `value`/`min`/`max`/`step`. The value is a `model<number>()`,
 * so Angular Signal Forms binds it two-way via `[control]` with no forms import.
 *
 * Most consumers want the finished {@link CngxSlider} component (`<cngx-slider>`)
 * which renders the track / fill / thumb for you and uses this directive as its
 * brain. Reach for `cngxSliderTrack` only when you want to own the skin markup.
 *
 * Positioning is left to the skin: the directive publishes the thumb position
 * as the inherited custom property `--cngx-slider-fraction` (0..1), which the
 * track / fill / thumb read. The default look ships as Track-B CSS in
 * `@cngx/themes/cngx.css`.
 *
 * ```html
 * <label id="vol-label">Volume</label>
 * <div cngxSliderTrack aria-labelledby="vol-label" [(value)]="volume" [min]="0" [max]="11">
 *   <span class="cngx-slider__track"><span class="cngx-slider__fill"></span></span>
 *   <span class="cngx-slider__thumb"></span>
 * </div>
 * ```
 *
 * Reach for {@link CngxRangeSliderTrack} when you need two thumbs (a min/max range).
 *
 * @category common/interactive/slider
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/slider/slider.directive.ts
 * @since 0.1.0
 * @relatedTo CngxSlider, CngxRangeSliderTrack, CngxSliderThumb, createSliderCore
 */
@Directive({
  selector: '[cngxSliderTrack]',
  exportAs: 'cngxSliderTrack',
  standalone: true,
  host: {
    role: 'slider',
    '[attr.aria-valuemin]': 'min()',
    '[attr.aria-valuemax]': 'max()',
    '[attr.aria-valuenow]': 'core.clampedValue()',
    '[attr.aria-valuetext]': 'core.ariaValueText()',
    '[attr.aria-orientation]': 'orientation()',
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.tabindex]': 'disabled() ? -1 : 0',
    '[style.touch-action]': "'none'",
    '[style.--cngx-slider-fraction]': 'core.fraction()',
    '(keydown)': 'interaction.handleKeydown($event)',
    '(pointerdown)': 'interaction.handlePointerDown($event)',
    '(pointermove)': 'interaction.handlePointerMove($event)',
    '(pointerup)': 'interaction.handlePointerUp($event)',
    '(pointercancel)': 'interaction.handlePointerUp($event)',
  },
})
export class CngxSliderTrack {
  /** Two-way value. The only state the keyboard / pointer handlers write. */
  readonly value = model<number>(0);
  /** Track lower bound (`aria-valuemin`). */
  readonly min = input<number>(0);
  /** Track upper bound (`aria-valuemax`). */
  readonly max = input<number>(100);
  /** Step granularity. `<= 0` makes the slider continuous. */
  readonly step = input<number>(1);
  /**
   * Page-key jump size (absolute, not a step multiple). Defaults to the
   * larger of one step and a tenth of the range.
   */
  readonly largeStep = input<number | undefined>(undefined);
  /** Whether the slider is disabled (blocks keyboard and pointer, `tabindex=-1`). */
  readonly disabled = input<boolean>(false);
  /** Track axis. Drives `aria-orientation` and the pointer-to-fraction math. */
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  /** Optional `aria-valuetext` formatter (currency, dates, named stops). */
  readonly valueText = input<((value: number) => string) | undefined>(undefined);

  private readonly el = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;

  /** Shared value/step/aria derivation. */
  protected readonly core = createSliderCore({
    value: this.value,
    min: this.min,
    max: this.max,
    step: this.step,
    valueText: (v) => {
      const format = this.valueText();
      return format ? format(v) : String(v);
    },
  });

  /** Thumb position along the track in `[0, 1]`. For a skin to read. */
  readonly fraction = this.core.fraction;
  /** Snapped + clamped value (`aria-valuenow`). For a skin to read. */
  readonly currentValue = this.core.clampedValue;
  /** Formatted display string (`aria-valuetext`). For a visible value label. */
  readonly displayValue = this.core.ariaValueText;

  private readonly pageStep = computed(() => {
    const explicit = this.largeStep();
    if (explicit && explicit > 0) {
      return explicit;
    }
    const grid = this.step() > 0 ? this.step() : 1;
    return Math.max(grid, (this.max() - this.min()) / 10);
  });

  /** Shared keyboard + pointer-drag handlers (same factory the range thumb uses). */
  protected readonly interaction = createSliderInteraction({
    core: this.core,
    el: this.el,
    disabled: () => this.disabled(),
    pageStep: () => this.pageStep(),
    fractionFromPointer: (x, y) => pointerFraction(this.el, this.orientation(), x, y),
  });
}
