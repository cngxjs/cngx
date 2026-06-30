import { computed, Directive, ElementRef, inject, input, model, signal } from '@angular/core';

import { createSliderCore } from './slider-core';

/**
 * Headless single-thumb slider. Put `cngxSlider` on the track element and the
 * directive turns it into an APG-conformant `role="slider"`: full keyboard
 * (Arrow / Page / Home / End), pointer-drag with capture, and the whole ARIA
 * value surface (`aria-valuemin/max/now/valuetext/orientation`) computed from
 * `value` and `min` and `max` and `step`. The value is a `model<number>()`, so
 * Angular Signal Forms binds it two-way via `[control]` with no forms import -
 * the dedicated `cngx-form-field` bridge is a `@cngx/forms` follow-up.
 *
 * Positioning is left to the skin: the directive publishes the thumb position
 * as the inherited custom property `--cngx-slider-fraction` (0..1), which the
 * track / fill / thumb read. The default look ships as Track-B CSS in
 * `@cngx/themes/cngx.css`.
 *
 * ```html
 * <label id="vol-label">Volume</label>
 * <div cngxSlider aria-labelledby="vol-label" [(value)]="volume" [min]="0" [max]="11">
 *   <span class="cngx-slider__track"><span class="cngx-slider__fill"></span></span>
 *   <span class="cngx-slider__thumb"></span>
 * </div>
 * ```
 *
 * Reach for {@link CngxRangeSlider} when you need two thumbs (a min/max range).
 *
 * @category common/interactive/slider
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/slider/slider.directive.ts
 * @since 0.1.0
 * @relatedTo CngxRangeSlider, CngxSliderThumb, createSliderCore
 */
@Directive({
  selector: '[cngxSlider]',
  exportAs: 'cngxSlider',
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
    '(keydown)': 'handleKeydown($event)',
    '(pointerdown)': 'handlePointerDown($event)',
    '(pointermove)': 'handlePointerMove($event)',
    '(pointerup)': 'handlePointerUp($event)',
    '(pointercancel)': 'handlePointerUp($event)',
  },
})
export class CngxSlider {
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
  private readonly dragging = signal(false);

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

  private readonly pageStep = computed(() => {
    const explicit = this.largeStep();
    if (explicit && explicit > 0) {
      return explicit;
    }
    const grid = this.step() > 0 ? this.step() : 1;
    return Math.max(grid, (this.max() - this.min()) / 10);
  });

  protected handleKeydown(event: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }
    const big = this.pageStep();
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        this.core.stepBy(1);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        this.core.stepBy(-1);
        break;
      case 'PageUp':
        this.core.setValue(this.core.clampedValue() + big);
        break;
      case 'PageDown':
        this.core.setValue(this.core.clampedValue() - big);
        break;
      case 'Home':
        this.core.stepToMin();
        break;
      case 'End':
        this.core.stepToMax();
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  protected handlePointerDown(event: PointerEvent): void {
    if (this.disabled()) {
      return;
    }
    try {
      this.el.setPointerCapture(event.pointerId);
    } catch {
      // setPointerCapture throws on an invalid pointerId (synthetic events
      // in some test envs) - the drag still works without capture.
    }
    this.dragging.set(true);
    this.el.focus();
    this.updateFromPointer(event);
    event.preventDefault();
  }

  protected handlePointerMove(event: PointerEvent): void {
    if (!this.dragging()) {
      return;
    }
    this.updateFromPointer(event);
  }

  protected handlePointerUp(event: PointerEvent): void {
    if (!this.dragging()) {
      return;
    }
    this.dragging.set(false);
    try {
      this.el.releasePointerCapture(event.pointerId);
    } catch {
      // Already released by the browser (e.g. on pointercancel) - ignore.
    }
  }

  private updateFromPointer(event: PointerEvent): void {
    const rect = this.el.getBoundingClientRect();
    const fraction =
      this.orientation() === 'vertical'
        ? rect.height > 0
          ? (rect.bottom - event.clientY) / rect.height
          : 0
        : rect.width > 0
          ? (event.clientX - rect.left) / rect.width
          : 0;
    this.core.setFromFraction(fraction);
  }
}
