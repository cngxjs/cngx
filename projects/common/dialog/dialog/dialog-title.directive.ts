import { computed, Directive, ElementRef, inject, signal } from '@angular/core';
import { nextUid } from '@cngx/core/utils';

import { DIALOG_REF } from './dialog-ref';

/**
 * Marks an element as the dialog's title for ARIA labelling.
 *
 * Automatically generates a deterministic ID and registers with the
 * parent `CngxDialog` for `aria-labelledby`. The title text is also
 * announced via `aria-live` when the dialog transitions to `'open'`.
 *
 * ```html
 * <dialog cngxDialog>
 *   <h2 cngxDialogTitle>Confirm Delete</h2>
 *   …
 * </dialog>
 * ```
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
  selector: '[cngxDialogTitle]',
  exportAs: 'cngxDialogTitle',
  standalone: true,
  host: {
    '[id]': 'id()',
  },
})
export class CngxDialogTitle {
  private readonly elRef = inject(ElementRef<HTMLElement>);
  private readonly dialogRef = inject(DIALOG_REF, { optional: true });

  /**
   * Auto-generated unique ID bound to the host `[id]` attribute.
   *
   * Used by `CngxDialog` for `aria-labelledby`. When a parent `CngxDialog`
   * is present, the ID is derived from the dialog's ID (e.g. `cngx-dialog-0-title`).
   */
  readonly id = signal(nextUid('cngx-dialog-title'));

  /**
   * Text content of the title element.
   *
   * Read by `CngxDialog` on open to announce the dialog title via
   * an `aria-live` region for screen readers.
   */
  readonly textContent = computed(
    () => (this.elRef.nativeElement as HTMLElement).textContent?.trim() ?? '',
  );

  constructor() {
    if (this.dialogRef) {
      this.id.set(`${this.dialogRef.id()}-title`);
    }
  }
}
