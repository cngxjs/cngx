import { DestroyRef, Directive, ElementRef, inject, signal } from '@angular/core';
import { nextUid } from '@cngx/core/utils';

import { CNGX_DIALOG_ARIA_REGISTRY } from './dialog-aria-registry';
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
 *
 * @category common/dialog
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/dialog/dialog/dialog-title.directive.ts
 * @since 0.1.0
 * @relatedTo CngxDialog, CngxDialogDescription, CngxDialogClose
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
  private readonly elRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dialogRef = inject(DIALOG_REF, { optional: true });
  private readonly ariaRegistry = inject(CNGX_DIALOG_ARIA_REGISTRY, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  private readonly idState = signal(nextUid('cngx-dialog-title'));

  /**
   * Auto-generated unique ID bound to the host `[id]` attribute.
   *
   * Used by `CngxDialog` for `aria-labelledby`. When a parent `CngxDialog`
   * is present, the ID is derived from the dialog's ID (e.g. `cngx-dialog-0-title`).
   * Read-only: an externally mutated id would silently break the ARIA wiring.
   */
  readonly id = this.idState.asReadonly();

  /**
   * Text content of the title element, read fresh on every call.
   *
   * Read by `CngxDialog` at announce time (each `'open'` transition) so a
   * changed title - translation swap, interpolated data - is what screen
   * readers hear. A `computed` would cache the first non-reactive DOM read
   * forever.
   */
  readonly textContent = (): string => this.elRef.nativeElement.textContent?.trim() ?? '';

  constructor() {
    if (this.dialogRef) {
      this.idState.set(`${this.dialogRef.id()}-title`);
    }
    // Push registration: content queries cannot see dynamically created
    // views, so programmatic dialogs rely on this channel exclusively.
    if (this.ariaRegistry) {
      this.destroyRef.onDestroy(this.ariaRegistry.registerTitle(this));
    }
  }
}
