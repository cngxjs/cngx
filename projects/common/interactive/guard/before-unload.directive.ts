import { DOCUMENT } from '@angular/common';
import { DestroyRef, Directive, inject, input } from '@angular/core';

/**
 * Prevents accidental page navigation when there are unsaved changes.
 *
 * Sets a `beforeunload` event handler that shows the browser's native
 * confirmation dialog when `enabled` is `true` (`preventDefault()` plus the
 * legacy `returnValue`, so older Chromium prompts too). Does NOT integrate with
 * the Angular Router - for route guard protection, use `canDeactivateWhenClean()`.
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
 * {
 *   path: 'edit',
 *   component: EditComponent,
 *   canDeactivate: [canDeactivateWhenClean((page: EditComponent) => page.editForm.dirty())],
 * }
 *
 * // In template:
 * <form [cngxBeforeUnload]="editForm.dirty()">…</form>
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/guard/before-unload.directive.ts
 * @since 0.3.0
 * @relatedTo canDeactivateWhenClean
 * <example-url>/#/common/interactive/guard/protect-dirty-form</example-url>
 * @axis level atom
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
        // Chromium before 119 ignores preventDefault() here and only prompts
        // on a truthy legacy returnValue.
        event.returnValue = true;
      }
    };

    win.addEventListener('beforeunload', handler);
    inject(DestroyRef).onDestroy(() => win.removeEventListener('beforeunload', handler));
  }
}
