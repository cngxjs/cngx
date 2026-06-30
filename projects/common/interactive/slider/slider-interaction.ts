import type { CngxSliderCore } from './slider-core';

/**
 * Maps a pointer position to a `0..1` track fraction against `el`'s geometry.
 * Vertical sliders measure bottom-up (fraction 0 at the lower edge) to match the
 * skin's bottom-anchored fill. Shared by the single slider and the range host so
 * the geometry math lives in exactly one place.
 *
 * @category common/interactive/slider
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/slider/slider-interaction.ts
 * @since 0.1.0
 */
export function pointerFraction(
  el: HTMLElement,
  orientation: 'horizontal' | 'vertical',
  clientX: number,
  clientY: number,
): number {
  const rect = el.getBoundingClientRect();
  const fraction =
    orientation === 'vertical'
      ? rect.height > 0
        ? (rect.bottom - clientY) / rect.height
        : 0
      : rect.width > 0
        ? (clientX - rect.left) / rect.width
        : 0;
  return Math.min(1, Math.max(0, fraction));
}

/** Options for {@link createSliderInteraction}. */
export interface CngxSliderInteractionOptions {
  /** The value core the handlers drive. */
  readonly core: CngxSliderCore;
  /** The focusable host element (pointer-capture target). */
  readonly el: HTMLElement;
  /** Whether interaction is currently disabled. */
  disabled(): boolean;
  /** Page-key jump size (absolute). */
  pageStep(): number;
  /** Map a pointer position to a `0..1` track fraction. */
  fractionFromPointer(clientX: number, clientY: number): number;
}

/** APG keyboard + pointer-drag handlers produced by {@link createSliderInteraction}. */
export interface CngxSliderInteraction {
  handleKeydown(event: KeyboardEvent): void;
  handlePointerDown(event: PointerEvent): void;
  handlePointerMove(event: PointerEvent): void;
  handlePointerUp(event: PointerEvent): void;
}

/**
 * Pure factory for a slider's keyboard + pointer-drag behaviour - the shared
 * interaction brain for both {@link CngxSlider} (single) and each
 * {@link CngxSliderThumb} (range). Arrow / Page / Home / End map onto the core's
 * step helpers; pointer-down captures the pointer and drags via the supplied
 * `fractionFromPointer`. Keeping this in one factory means the track and the
 * thumb cannot drift apart.
 *
 * @category common/interactive/slider
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/slider/slider-interaction.ts
 * @since 0.1.0
 * @relatedTo createSliderCore, CngxSlider, CngxSliderThumb
 */
export function createSliderInteraction(
  options: CngxSliderInteractionOptions,
): CngxSliderInteraction {
  const { core, el } = options;
  let dragging = false;

  const updateFromPointer = (event: PointerEvent): void => {
    core.setFromFraction(options.fractionFromPointer(event.clientX, event.clientY));
  };

  return {
    handleKeydown(event: KeyboardEvent): void {
      if (options.disabled()) {
        return;
      }
      const big = options.pageStep();
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          core.stepBy(1);
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
          core.stepBy(-1);
          break;
        case 'PageUp':
          core.setValue(core.clampedValue() + big);
          break;
        case 'PageDown':
          core.setValue(core.clampedValue() - big);
          break;
        case 'Home':
          core.stepToMin();
          break;
        case 'End':
          core.stepToMax();
          break;
        default:
          return;
      }
      event.preventDefault();
    },

    handlePointerDown(event: PointerEvent): void {
      if (options.disabled()) {
        return;
      }
      try {
        el.setPointerCapture(event.pointerId);
      } catch {
        // setPointerCapture throws on an invalid pointerId (synthetic events in
        // some test envs) - the drag still works without capture.
      }
      dragging = true;
      el.focus();
      updateFromPointer(event);
      event.preventDefault();
    },

    handlePointerMove(event: PointerEvent): void {
      if (!dragging) {
        return;
      }
      updateFromPointer(event);
    },

    handlePointerUp(event: PointerEvent): void {
      if (!dragging) {
        return;
      }
      dragging = false;
      try {
        el.releasePointerCapture(event.pointerId);
      } catch {
        // Already released by the browser (e.g. on pointercancel) - ignore.
      }
    },
  };
}
