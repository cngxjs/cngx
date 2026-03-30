import { inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * Creates a functional route guard that blocks navigation when the form is dirty.
 *
 * Works with Angular's `CanDeactivateFn`. The `isDirty` callback is evaluated
 * on each navigation attempt. When dirty, shows a `confirm` dialog.
 *
 * Uses `DOCUMENT` injection for SSR safety — returns `true` (allow) when
 * no window is available.
 *
 * Pair with `CngxBeforeUnload` for full coverage (browser close + route change):
 *
 * ```typescript
 * // Route config
 * {
 *   path: 'edit',
 *   component: EditComponent,
 *   canDeactivate: [canDeactivateWhenClean(() => inject(EditComponent).isDirty())]
 * }
 * ```
 *
 * @param isDirty - Callback that returns `true` when there are unsaved changes.
 * @param message - Confirmation message. Default: `'You have unsaved changes. Leave anyway?'`
 * @returns A functional guard compatible with Angular's `canDeactivate`.
 *
 * @category interactive
 */
export function canDeactivateWhenClean(
  isDirty: () => boolean,
  message = 'You have unsaved changes. Leave anyway?',
): () => boolean {
  return () => {
    if (!isDirty()) {
      return true;
    }
    // inject() is valid here — Angular calls the guard in an injection context
    const win = inject(DOCUMENT).defaultView;
    if (!win) {
      return true; // SSR — allow navigation
    }
    return win.confirm(message);
  };
}
