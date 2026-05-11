import { DOCUMENT } from '@angular/common';
import { DestroyRef, Directive, inject, input } from '@angular/core';

/**
 * Prevents accidental page navigation when there are unsaved changes.
 *
 * Sets a `beforeunload` event handler that shows the browser's native
 * confirmation dialog when `enabled` is `true`. Does NOT integrate with
 * the Angular Router — for route guard protection, use `canDeactivateWhenClean()`.
 *
 * @usageNotes
 *
 * ### Protect a form
 * ```html
 * <form [cngxBeforeUnload]="form.dirty()">
 *   …
 * </form>
 * ```
 *
 * ### Combined with route guard
 * ```typescript
 * // In route config:
 * { path: 'edit', component: EditComponent, canDeactivate: [canDeactivateWhenClean(() => editForm.dirty())] }
 *
 * // In template:
 * <form [cngxBeforeUnload]="editForm.dirty()">…</form>
 * ```
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxBeforeUnload]',
  exportAs: 'cngxBeforeUnload',
  standalone: true,
})
export class CngxBeforeUnload {
  /** Whether the beforeunload guard is active. */
  readonly enabled = input.required<boolean>({ alias: 'cngxBeforeUnload' });

  constructor() {
    const win = inject(DOCUMENT).defaultView;
    if (!win) {
      return;
    }

    const handler = (event: BeforeUnloadEvent) => {
      if (this.enabled()) {
        event.preventDefault();
      }
    };

    win.addEventListener('beforeunload', handler);
    inject(DestroyRef).onDestroy(() => win.removeEventListener('beforeunload', handler));
  }
}
