import { inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

import { injectResolvedInteractiveI18n } from '../i18n/interactive-i18n';

/**
 * Creates a functional route guard that blocks navigation when the routed
 * component reports unsaved changes.
 *
 * The Router calls the guard with the component instance of the route it
 * leaves; `isDirty` receives that instance on each navigation attempt. When
 * it returns `true`, the guard shows a `confirm` dialog. A zero-argument
 * callback still fits for state that lives outside the component.
 *
 * The returned function is assignable to `CanDeactivateFn<T>` from
 * `@angular/router`; the type is structural so this entry point does not
 * import the optional router peer.
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
 *   canDeactivate: [canDeactivateWhenClean((page: EditComponent) => page.isDirty())]
 * }
 * ```
 *
 * @param isDirty - Receives the routed component, returns `true` when there are unsaved changes.
 * @param message - Confirmation message. Unset, it reads `unsavedChanges` of
 *   `CNGX_INTERACTIVE_I18N` (English `'You have unsaved changes. Leave anyway?'`)
 *   when the guard runs, so it follows the active language.
 * @returns A functional guard compatible with Angular's `canDeactivate`.
 */
export function canDeactivateWhenClean<T = unknown>(
  isDirty: (component: T) => boolean,
  message?: string,
): (component: T) => boolean {
  return (component) => {
    if (!isDirty(component)) {
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
