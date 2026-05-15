import { Directive, inject, signal } from '@angular/core';
import { nextUid } from '@cngx/core/utils';

import { DIALOG_REF } from './dialog-ref';

/**
 * Marks an element as the dialog's description for ARIA.
 *
 * Automatically generates a deterministic ID and registers with the
 * parent `CngxDialog` for `aria-describedby`.
 *
 * ```html
 * <dialog cngxDialog>
 *   <h2 cngxDialogTitle>Delete item?</h2>
 *   <p cngxDialogDescription>This action cannot be undone.</p>
 *   …
 * </dialog>
 * ```
 * <example-url>http://localhost:4200/common/dialog/dialog/alert-dialog</example-url>
 * <example-url>http://localhost:4200/common/dialog/dialog/bottom-sheet</example-url>
 * <example-url>http://localhost:4200/common/dialog/dialog/cngxdialogopener-programmatic</example-url>
 * <example-url>http://localhost:4200/common/dialog/dialog/draggable-dialog</example-url>
 * <example-url>http://localhost:4200/common/dialog/dialog/fully-declarative</example-url>
 * <example-url>http://localhost:4200/common/dialog/dialog/grid-snap-live-vs-release</example-url>
 * <example-url>http://localhost:4200/common/dialog/dialog/nested-dialogs-cngxdialogstack</example-url>
 * <example-url>http://localhost:4200/common/dialog/dialog/non-modal-panel</example-url>
 * <example-url>http://localhost:4200/common/dialog/dialog/programmatic-control</example-url>
 * <example-url>http://localhost:4200/common/dialog/dialog/template-directives</example-url>
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
  readonly id = signal(nextUid('cngx-dialog-desc'));

  constructor() {
    if (this.dialogRef) {
      this.id.set(`${this.dialogRef.id()}-desc`);
    }
  }
}
