import { InjectionToken, type Signal } from '@angular/core';

/**
 * How an open popover is laid out: anchored to its trigger, as a bottom
 * sheet, or filling the viewport.
 *
 * @category common/popover
 * @since 0.1.0
 */
export type CngxPopoverPresentation = 'anchored' | 'sheet' | 'fullscreen';

/**
 * @internal Contract between `CngxPopover` and a presentation modifier on the
 * same element. `CngxPopover` drops every anchor and floating write while
 * `presentation()` is not `'anchored'`, and calls `onShown()` / `onHide()`
 * synchronously inside `show()` / `hide()` so the modifier can move focus and
 * release page state in the caller's stack.
 */
export interface CngxPopoverPresentationSeam {
  readonly presentation: Signal<CngxPopoverPresentation>;
  /** Runs right after `showPopover()`, with the host already `aria-hidden="false"`. */
  onShown(): void;
  /** Runs once per `hide()`, before any close transition starts (state still open). */
  onHide(): void;
}

/** @internal Resolved by `CngxPopover` on its own element only (`self: true`). */
export const CNGX_POPOVER_PRESENTATION = new InjectionToken<CngxPopoverPresentationSeam>(
  'CngxPopoverPresentation',
);
