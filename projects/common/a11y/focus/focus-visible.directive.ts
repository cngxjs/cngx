import { DOCUMENT } from '@angular/common';
import { DestroyRef, Directive, inject, signal } from '@angular/core';

/**
 * Tracks keyboard-initiated focus on the host element.
 *
 * Adds `cngx-focus-visible` CSS class when the element receives focus via keyboard
 * and removes it on blur or when focus was initiated by pointer interaction.
 *
 *
 * ```html
 * <button cngxFocusVisible #fv="cngxFocusVisible">
 *   @if (fv.focusVisible()) { Focus ring visible }
 * </button>
 * ```
 *
 * @category common/a11y
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/a11y/focus/focus-visible.directive.ts
 * @since 0.1.0
 * @relatedTo CngxAutofocus, CngxFocusRestore, CngxFocusTrap
 * <example-url>http://localhost:4200/#/common/a11y/focus-visible/form-fields-custom-focus-ring</example-url>
 * <example-url>http://localhost:4200/#/common/a11y/focus-visible/keyboard-vs-pointer</example-url>
 */
@Directive({
  selector: '[cngxFocusVisible]',
  exportAs: 'cngxFocusVisible',
  standalone: true,
  host: {
    '(pointerdown)': 'handlePointerDown()',
    '(focusin)': 'handleFocus()',
    '(focusout)': 'handleBlur()',
    '[class.cngx-focus-visible]': 'focusVisible()',
  },
})
export class CngxFocusVisible {
  private readonly doc = inject(DOCUMENT);
  private readonly focusVisibleState = signal(false);
  /** `true` when focus was initiated via keyboard (not pointer). */
  readonly focusVisible = this.focusVisibleState.asReadonly();

  /** @internal Cleared on `focusin`, `pointerup` (document-level), or `pointercancel`. */
  pointerActive = false;

  private readonly clearPointerActive = (): void => {
    this.pointerActive = false;
  };

  constructor() {
    inject(DestroyRef).onDestroy(() =>
      this.doc.removeEventListener('pointerup', this.clearPointerActive, true),
    );
  }

  /** @internal Arms the pointer flag for the imminent focusin. */
  protected handlePointerDown(): void {
    this.pointerActive = true;
    // The flag must not outlive the click: a pointerdown that never focuses
    // (disabled child, text selection, drag released off-host) would
    // otherwise suppress the ring on the NEXT keyboard Tab-in. Document-level
    // capture catches the release wherever it lands; focusin (which fires
    // before pointerup) has already consumed the flag in the focusing case.
    this.doc.addEventListener('pointerup', this.clearPointerActive, {
      once: true,
      capture: true,
    });
  }

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
