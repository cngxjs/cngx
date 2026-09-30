import { computed, Directive, ElementRef, inject, input } from '@angular/core';
import { coerceSignal } from '@cngx/core/utils';

import { injectDialogConfig } from '../config/dialog-config';
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
 * ```html
 * <dialog cngxDialog>
 *   <button [cngxDialogClose]="false">Cancel</button>
 *   <button [cngxDialogClose]="true">Confirm</button>
 * </dialog>
 * ```
 *
 * @category common/dialog
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/dialog/dialog/dialog-close.directive.ts
 * @since 0.1.0
 * @relatedTo CngxDialog, CngxDialogTitle, CngxDialogDescription
 * <example-url>http://localhost:4200/#/common/dialog/alert-dialog</example-url>
 * <example-url>http://localhost:4200/#/common/dialog/bottom-sheet</example-url>
 * <example-url>http://localhost:4200/#/common/dialog/cngxdialogopener-programmatic</example-url>
 * <example-url>http://localhost:4200/#/common/dialog/draggable-dialog</example-url>
 * <example-url>http://localhost:4200/#/common/dialog/fully-declarative</example-url>
 * <example-url>http://localhost:4200/#/common/dialog/grid-snap-live-vs-release</example-url>
 * <example-url>http://localhost:4200/#/common/dialog/nested-dialogs-cngxdialogstack</example-url>
 * <example-url>http://localhost:4200/#/common/dialog/non-modal-panel</example-url>
 * <example-url>http://localhost:4200/#/common/dialog/programmatic-control</example-url>
 * <example-url>http://localhost:4200/#/common/dialog/template-directives</example-url>
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
  private readonly labels = coerceSignal(injectDialogConfig().labels);

  /** Value to pass to `close()`. When `undefined`, calls `dismiss()` instead. */
  readonly value = input<unknown>(undefined, { alias: 'cngxDialogClose' });

  /**
   * Explicit `aria-label` override. Bind a dynamic accessible name here,
   * not through `[attr.aria-label]`: the directive owns the host's
   * `aria-label` binding, so a second binding on the same attribute races it.
   * A static `aria-label="..."` attribute on the host is kept as is.
   *
   * When not set, the directive auto-detects whether the host element
   * has descriptive text content. If it does (e.g. "Cancel", "Confirm"),
   * no `aria-label` is added. If the content is a single character,
   * empty, or visually an icon, `aria-label` defaults to `"Close dialog"`.
   */
  readonly label = input<string | undefined>(undefined, { alias: 'cngxDialogCloseLabel' });

  // The value is read once at construction and written back through the host
  // binding: returning null would remove the consumer's attribute, and after
  // the first render the binding owns aria-label, so a recompute must not
  // mistake the directive's own value for a consumer-authored one.
  private readonly consumerAriaLabel = (this.elRef.nativeElement as HTMLElement).getAttribute(
    'aria-label',
  );

  /** Set type="button" on <button> hosts to prevent form submit. */
  protected readonly hostType =
    (this.elRef.nativeElement as HTMLElement).tagName === 'BUTTON' ? 'button' : null;

  /**
   * Computed `aria-label`. Returns:
   * - explicit `label()` input if set
   * - the consumer's static `aria-label` attribute, kept as is
   * - `null` if host text is descriptive (> 1 char, not whitespace-only)
   * - `'Close dialog'` for icon-only / single-char content
   */
  protected readonly ariaLabel = computed(() => {
    const explicit = this.label();
    if (explicit !== undefined) {
      return explicit || null;
    }

    if (this.consumerAriaLabel !== null) {
      return this.consumerAriaLabel;
    }

    const el = this.elRef.nativeElement as HTMLElement;
    const text = el.textContent?.trim() ?? '';
    if (text.length > 1) {
      return null;
    }

    return this.labels().close;
  });

  protected handleClick(): void {
    const v = this.value();
    // Static attribute `cngxDialogClose` (no binding) resolves to '' - treat as dismiss.
    // Only `[cngxDialogClose]="value"` with an explicit value calls close().
    if (v !== undefined && v !== '') {
      this.dialogRef.close(v);
    } else {
      this.dialogRef.dismiss();
    }
  }
}
