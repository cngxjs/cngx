import { computed, Directive, ElementRef, inject, input } from '@angular/core';

import { DIALOG_REF } from './dialog-ref';

/**
 * Close trigger for a dialog. Place on any clickable element inside a dialog.
 *
 * - With a value: `[cngxDialogClose]="'confirm'"` calls `dialogRef.close(value)`
 * - Without a value: `cngxDialogClose` calls `dialogRef.dismiss()`
 *
 * Automatically sets `type="button"` on `<button>` hosts to prevent
 * accidental form submission. Sets a default `aria-label="Close dialog"`
 * when the host has no descriptive text content (icon-only buttons).
 *
 * @usageNotes
 * ```html
 * <dialog cngxDialog>
 *   <button [cngxDialogClose]="false">Cancel</button>
 *   <button [cngxDialogClose]="true">Confirm</button>
 * </dialog>
 * ```
 */
@Directive({
  selector: '[cngxDialogClose]',
  exportAs: 'cngxDialogClose',
  standalone: true,
  host: {
    '(click)': 'handleClick()',
    '[attr.type]': 'hostType',
    '[attr.aria-label]': 'ariaLabel()',
  },
})
export class CngxDialogClose {
  private readonly dialogRef = inject(DIALOG_REF);
  private readonly elRef = inject(ElementRef<HTMLElement>);

  /** Value to pass to `close()`. When `undefined`, calls `dismiss()` instead. */
  readonly value = input<unknown>(undefined, { alias: 'cngxDialogClose' });

  /**
   * Explicit `aria-label` override.
   *
   * When not set, the directive auto-detects whether the host element
   * has descriptive text content. If it does (e.g. "Cancel", "Confirm"),
   * no `aria-label` is added. If the content is a single character,
   * empty, or visually an icon, `aria-label` defaults to `"Close dialog"`.
   */
  readonly label = input<string | undefined>(undefined, { alias: 'cngxDialogCloseLabel' });

  /** Set type="button" on <button> hosts to prevent form submit. */
  protected readonly hostType =
    (this.elRef.nativeElement as HTMLElement).tagName === 'BUTTON' ? 'button' : null;

  /**
   * Computed `aria-label`. Returns:
   * - explicit `label()` input if set
   * - `null` if host text is descriptive (> 1 char, not whitespace-only)
   * - `'Close dialog'` for icon-only / single-char content
   */
  protected readonly ariaLabel = computed(() => {
    // Explicit override wins
    const explicit = this.label();
    if (explicit !== undefined) {return explicit || null;}

    // If host already has aria-label attribute set by the consumer, don't override
    const el = this.elRef.nativeElement as HTMLElement;
    if (el.hasAttribute('aria-label')) {return null;}

    // Check text content — if descriptive (multi-char word), no label needed
    const text = el.textContent?.trim() ?? '';
    if (text.length > 1) {return null;}

    // Icon-only or single char (e.g. "X", "x") — set default
    return 'Close dialog';
  });

  protected handleClick(): void {
    const v = this.value();
    // Static attribute `cngxDialogClose` (no binding) resolves to '' — treat as dismiss.
    // Only `[cngxDialogClose]="value"` with an explicit value calls close().
    if (v !== undefined && v !== '') {
      this.dialogRef.close(v);
    } else {
      this.dialogRef.dismiss();
    }
  }
}
