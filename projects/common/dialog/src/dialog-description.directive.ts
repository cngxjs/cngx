import { Directive, inject, signal } from '@angular/core';

import { DIALOG_REF } from './dialog-ref';

let nextDescId = 0;

/**
 * Marks an element as the dialog's description for ARIA.
 *
 * Automatically generates a deterministic ID and registers with the
 * parent `CngxDialog` for `aria-describedby`.
 *
 * @usageNotes
 * ```html
 * <dialog cngxDialog>
 *   <h2 cngxDialogTitle>Delete item?</h2>
 *   <p cngxDialogDescription>This action cannot be undone.</p>
 *   …
 * </dialog>
 * ```
 */
@Directive({
  selector: '[cngxDialogDescription]',
  exportAs: 'cngxDialogDescription',
  standalone: true,
  host: {
    '[id]': 'id()',
  },
})
export class CngxDialogDescription {
  private readonly dialogRef = inject(DIALOG_REF, { optional: true });

  /**
   * Auto-generated unique ID bound to the host `[id]` attribute.
   *
   * Used by `CngxDialog` for `aria-describedby`. When a parent `CngxDialog`
   * is present, the ID is derived from the dialog's ID (e.g. `cngx-dialog-0-desc`).
   */
  readonly id = signal(`cngx-dialog-desc-${nextDescId++}`);

  constructor() {
    if (this.dialogRef) {
      this.id.set(`${this.dialogRef.id()}-desc`);
    }
  }
}
