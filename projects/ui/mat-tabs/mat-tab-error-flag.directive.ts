import { DestroyRef, Directive, effect, inject, input, untracked } from '@angular/core';

import { injectMatTabErrorTarget } from './mat-tab-error-target';

/**
 * Per-tab direct invalid flag for `[cngxMatTabs]` - the simple-case
 * sibling to `[cngxMatTabError]`. Attach to a `<mat-tab>`; the bound
 * `string | boolean` writes the per-handle `directError` slot, which
 * folds into the handle's `hasError` / `errorMessage`. A non-empty
 * string doubles as the SR descriptor message; `true` marks the tab
 * invalid with no message; `false` / `''` clear it. The folded state
 * drives the same header decoration as the aggregator: the
 * `cngx-mat-tab--has-errors` badge plus an SR-only descriptor span
 * referenced through `aria-describedby` (message, else the
 * `tabHasErrors` i18n phrase), removed again when the flag clears.
 *
 * Symmetric with `[cngxMatTabError]` (one directive, one
 * responsibility - Pillar 3): the aggregator stays the rich
 * multi-source path, this is the "this tab is invalid" marker that
 * needs no aggregator boilerplate. A bare `cngxMatTabErrorFlag`
 * attribute (no brackets) binds the empty string and is coerced to
 * `true` so presence alone marks the tab invalid.
 *
 * Locates its target via {@link CNGX_MAT_TABS_REGISTRY_HOST}, tracks
 * `presenter.tabs()` to recover from the content-init race, and
 * clears the slot on destroy - exactly as {@link CngxMatTabError}.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/mat-tabs/mat-tab-error-flag.directive.ts
 * @since 0.1.0
 * @relatedTo CngxMatTabs, CngxMatTabError, CngxMatTabsRegistry
 * @axis level atom
 */
@Directive({
  selector: '[cngxMatTabErrorFlag]',
  exportAs: 'cngxMatTabErrorFlag',
  standalone: true,
})
export class CngxMatTabErrorFlag {
  private readonly target = injectMatTabErrorTarget('cngxMatTabErrorFlag');
  private readonly destroyRef = inject(DestroyRef);

  readonly error = input<string | boolean, string | boolean>(false, {
    alias: 'cngxMatTabErrorFlag',
    transform: (value) => (value === '' ? true : value),
  });

  constructor() {
    effect(() => {
      // Same content-init race as `[cngxMatTabError]` - the registry's
      // `contentChildren(MatTab)` query and our injection land in the
      // same microtask, so tracking `presenter.tabs()` re-fires the
      // effect once our handle is registered. `untracked` around the
      // write keeps the slot pump out of the reactive graph.
      const error = this.error();
      this.target.presenter.tabs();

      untracked(() => {
        const setup = this.target.registry.getHandleSetup(this.target.matTab);
        setup?.directError.set(error);
      });
    });

    this.destroyRef.onDestroy(() => {
      const setup = this.target.registry.getHandleSetup(this.target.matTab);
      setup?.directError.set(false);
    });
  }
}
