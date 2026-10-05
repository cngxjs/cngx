import { inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

import { injectResolvedInteractiveI18n } from '../i18n/interactive-i18n';

/**
 * Creates a functional route guard that blocks navigation when the form is dirty.
 *
 * Works with Angular's `CanDeactivateFn`. The `isDirty` callback is evaluated
 * on each navigation attempt. When dirty, shows a `confirm` dialog.
 *
 * Uses `DOCUMENT` injection for SSR safety - returns `true` (allow) when
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
 * @param message - Confirmation message. Unset, it reads `unsavedChanges` of
 *   `CNGX_INTERACTIVE_I18N` (English `'You have unsaved changes. Leave anyway?'`)
 *   when the guard runs, so it follows the active language.
 * @returns A functional guard compatible with Angular's `canDeactivate`.
 *
 * @category common/interactive/guard
 */
export function canDeactivateWhenClean(isDirty: () => boolean, message?: string): () => boolean {
  return () => {
    if (!isDirty()) {
      return true;
    }
    // inject() is valid here - Angular calls the guard in an injection context
    const win = inject(DOCUMENT).defaultView;
    if (!win) {
      return true;
    }
    return win.confirm(message ?? injectResolvedInteractiveI18n()().unsavedChanges);
  };
}
