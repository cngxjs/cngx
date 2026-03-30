import { Directive, signal } from '@angular/core';

/**
 * Tracks keyboard-initiated focus on the host element.
 *
 * Adds `cngx-focus-visible` CSS class when the element receives focus via keyboard
 * and removes it on blur or when focus was initiated by pointer interaction.
 *
 * @category a11y
 *
 * ```html
 * <button cngxFocusVisible #fv="cngxFocusVisible">
 *   @if (fv.focusVisible()) { Focus ring visible }
 * </button>
 * ```
 */
@Directive({
  selector: '[cngxFocusVisible]',
  exportAs: 'cngxFocusVisible',
  standalone: true,
  host: {
    '(pointerdown)': 'pointerActive = true',
    '(focusin)': 'handleFocus()',
    '(focusout)': 'handleBlur()',
    '[class.cngx-focus-visible]': 'focusVisible()',
  },
})
export class CngxFocusVisible {
  private readonly focusVisibleState = signal(false);
  /** `true` when focus was initiated via keyboard (not pointer). */
  readonly focusVisible = this.focusVisibleState.asReadonly();

  /** @internal Cleared on `focusin` after being set by `pointerdown`. */
  pointerActive = false;

  /** @internal Sets focus-visible state; clears pointer flag. */
  protected handleFocus(): void {
    this.focusVisibleState.set(!this.pointerActive);
    this.pointerActive = false;
  }

  /** @internal Clears focus-visible state on blur. */
  protected handleBlur(): void {
    this.focusVisibleState.set(false);
  }
}
