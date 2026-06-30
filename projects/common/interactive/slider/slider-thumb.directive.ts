import {
  computed,
  Directive,
  ElementRef,
  inject,
  input,
  type Signal,
  type WritableSignal,
} from '@angular/core';

import { createSliderCore } from './slider-core';
import {
  CNGX_SLIDER_RANGE,
  type CngxSliderRangeHost,
  type CngxSliderThumbPosition,
} from './range-slider.token';

/**
 * Builds a `WritableSignal<number>` view over one end of the range tuple:
 * reads `range.value()[index]` reactively, routes writes through
 * `range.commit(position, …)`. Lets a thumb run an ordinary
 * {@link createSliderCore} (which writes a `WritableSignal`) while the tuple
 * stays the single source of truth - no local state, no effect sync.
 */
function createThumbValue(
  range: CngxSliderRangeHost,
  position: Signal<CngxSliderThumbPosition>,
): WritableSignal<number> {
  const read = computed(() => {
    const [start, end] = range.value();
    return position() === 'start' ? start : end;
  });
  const accessor = Object.assign(() => read(), {
    set: (next: number) => range.commit(position(), next),
    update: (updater: (prev: number) => number) => range.commit(position(), updater(read())),
    asReadonly: () => read,
  });
  return accessor as unknown as WritableSignal<number>;
}

/**
 * One focusable thumb of a {@link CngxRangeSlider}. Place `cngxSliderThumb` on
 * each thumb element with `"start"` or `"end"`; the directive turns it into an
 * independent `role="slider"` with its own `aria-valuenow`/`valuetext` and APG
 * keyboard, bounded by the sibling thumb so the two can never cross. It reads
 * the shared track config from {@link CNGX_SLIDER_RANGE} (injected up the
 * element-injector hierarchy) and commits its end through the host.
 *
 * Two focusable thumbs cannot be derived from a single host element, so each
 * thumb is its own directive - the headless contract the skin marks up.
 *
 * @category common/interactive/slider
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/slider/slider-thumb.directive.ts
 * @since 0.1.0
 * @relatedTo CngxRangeSlider, CngxSlider, createSliderCore
 */
@Directive({
  selector: '[cngxSliderThumb]',
  exportAs: 'cngxSliderThumb',
  standalone: true,
  host: {
    role: 'slider',
    '[attr.aria-valuemin]': 'bounds().min()',
    '[attr.aria-valuemax]': 'bounds().max()',
    '[attr.aria-valuenow]': 'core.clampedValue()',
    '[attr.aria-valuetext]': 'core.ariaValueText()',
    '[attr.aria-orientation]': 'range.orientation()',
    '[attr.aria-disabled]': 'range.disabled() || null',
    '[attr.tabindex]': 'range.disabled() ? -1 : 0',
    '[style.touch-action]': "'none'",
    '[style.--cngx-slider-fraction]': 'core.fraction()',
    '(keydown)': 'handleKeydown($event)',
    '(pointerdown)': 'handlePointerDown($event)',
    '(pointermove)': 'handlePointerMove($event)',
    '(pointerup)': 'handlePointerUp($event)',
    '(pointercancel)': 'handlePointerUp($event)',
  },
})
export class CngxSliderThumb {
  /** Which end of the range this thumb drives. Bound from the selector. */
  readonly position = input.required<CngxSliderThumbPosition>({ alias: 'cngxSliderThumb' });

  protected readonly range = inject(CNGX_SLIDER_RANGE);
  private readonly el = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private dragging = false;

  /** Sibling-clamped bounds for this thumb, selected reactively by position. */
  protected readonly bounds = computed(() => this.range.boundsFor(this.position()));

  private readonly value = createThumbValue(this.range, this.position);

  /** Shared value/step/aria derivation, bounded by the sibling thumb. */
  protected readonly core = createSliderCore({
    value: this.value,
    min: this.range.min,
    max: this.range.max,
    step: this.range.step,
    boundedMin: computed(() => this.bounds().min()),
    boundedMax: computed(() => this.bounds().max()),
    valueText: (v) => {
      const format = this.range.valueText();
      return format ? format(v) : String(v);
    },
  });

  private readonly pageStep = computed(() => {
    const grid = this.range.step() > 0 ? this.range.step() : 1;
    return Math.max(grid, (this.range.max() - this.range.min()) / 10);
  });

  protected handleKeydown(event: KeyboardEvent): void {
    if (this.range.disabled()) {
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
    if (this.range.disabled()) {
      return;
    }
    try {
      this.el.setPointerCapture(event.pointerId);
    } catch {
      // setPointerCapture throws on an invalid pointerId - drag still works.
    }
    this.dragging = true;
    this.el.focus();
    this.updateFromPointer(event);
    event.preventDefault();
  }

  protected handlePointerMove(event: PointerEvent): void {
    if (!this.dragging) {
      return;
    }
    this.updateFromPointer(event);
  }

  protected handlePointerUp(event: PointerEvent): void {
    if (!this.dragging) {
      return;
    }
    this.dragging = false;
    try {
      this.el.releasePointerCapture(event.pointerId);
    } catch {
      // Already released by the browser (e.g. on pointercancel) - ignore.
    }
  }

  private updateFromPointer(event: PointerEvent): void {
    const rect = this.el.getBoundingClientRect();
    const fraction =
      this.range.orientation() === 'vertical'
        ? rect.height > 0
          ? (rect.bottom - event.clientY) / rect.height
          : 0
        : rect.width > 0
          ? (event.clientX - rect.left) / rect.width
          : 0;
    this.core.setFromFraction(fraction);
  }
}
