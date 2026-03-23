import { Directive, signal } from '@angular/core';

/**
 * Tracks keyboard-initiated focus on the host element.
 *
 * Adds `cngx-focus-visible` CSS class when the element receives focus via keyboard
 * and removes it on blur or when focus was initiated by pointer interaction.
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
    '(pointerdown)': '_pointerActive = true',
    '(focusin)': 'onFocus()',
    '(focusout)': 'onBlur()',
    '[class.cngx-focus-visible]': 'focusVisible()',
  },
})
export class CngxFocusVisible {
  private readonly _focusVisible = signal(false);
  readonly focusVisible = this._focusVisible.asReadonly();

  /** @internal */
  _pointerActive = false;

  protected onFocus(): void {
    this._focusVisible.set(!this._pointerActive);
    this._pointerActive = false;
  }

  protected onBlur(): void {
    this._focusVisible.set(false);
  }
}
