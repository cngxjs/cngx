import { DestroyRef, Directive, inject, input } from '@angular/core';
import { CngxSwipeDismiss } from '@cngx/common/interactive';

import { DIALOG_REF } from '../dialog/dialog-ref';

/**
 * Bottom sheet molecule - a `CngxDialog` positioned at the viewport bottom
 * with swipe-to-dismiss support.
 *
 * Place on the same `<dialog>` element alongside `cngxDialog`. Adds the
 * `cngx-bottom-sheet` CSS class (styled by `bottom-sheet-theme.scss`).
 * When `CngxSwipeDismiss` is also present, auto-wires the swipe output
 * to `dialogRef.dismiss()` - no manual `(swiped)` binding needed.
 *
 * ### Basic bottom sheet
 * ```html
 * <dialog cngxDialog cngxBottomSheet [cngxSwipeDismiss]="'down'"
 *         #sheet="cngxDialog">
 *   <h2 cngxDialogTitle>Share</h2>
 *   <button [cngxDialogClose]="'copy'">Copy Link</button>
 *   <button [cngxDialogClose]="'email'">Email</button>
 *   <button cngxDialogClose>Cancel</button>
 * </dialog>
 * <button (click)="sheet.open()">Share</button>
 * ```
 *
 * ### Without swipe (static bottom sheet)
 * ```html
 * <dialog cngxDialog cngxBottomSheet #sheet="cngxDialog">
 *   <p>Content positioned at the bottom.</p>
 * </dialog>
 * ```
 *
 * @category common/dialog
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/dialog/bottom-sheet/bottom-sheet.directive.ts
 * @since 0.1.0
 * @relatedTo CngxDialog, CngxSwipeDismiss, CngxDialogClose
 */
@Directive({
  selector: 'dialog[cngxBottomSheet]',
  exportAs: 'cngxBottomSheet',
  standalone: true,
  host: {
    class: 'cngx-bottom-sheet',
  },
})
export class CngxBottomSheet {
  private readonly dialogRef = inject(DIALOG_REF);
  private readonly swipe = inject(CngxSwipeDismiss, { self: true, optional: true });

  /**
   * Whether the drag handle bar is visible.
   *
   * The handle itself is rendered via CSS (`::before` pseudo-element on the host).
   * Set to `false` to hide it.
   *
   * @defaultValue `true`
   */
  readonly showHandle = input(true);

  constructor() {
    if (this.swipe) {
      const sub = this.swipe.swiped.subscribe(() => this.dialogRef.dismiss());
      inject(DestroyRef).onDestroy(() => sub.unsubscribe());
    }
  }
}
