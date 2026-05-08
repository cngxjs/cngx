import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxTabHandle } from '../tab-group-host.token';

/**
 * Context passed to the `*cngxTabOverflowTrigger` template. Drives the
 * More-button label / glyph; consumers replace the default
 * `i18n.moreTabsLabel(count)` text with arbitrary markup (icon +
 * counter badge, custom localisation, etc.) while the surrounding
 * `<button cngxPopoverTrigger>` shell — including `aria-haspopup`,
 * `aria-expanded`, click handler, hidden binding — stays library-owned.
 *
 * @category interactive
 */
export interface CngxTabOverflowTriggerContext {
  /** Convenience alias for `count` — usable as `let-count` shorthand. */
  readonly $implicit: number;
  /** Number of hidden tabs currently surfaced through the overflow popover. */
  readonly count: number;
  /** Hidden tabs, in the order they appear in `presenter.tabs()`. */
  readonly hiddenTabs: readonly CngxTabHandle[];
}

/**
 * Structural slot directive marking the More-button label template
 * for `<cngx-tab-overflow>`. Discovered via `contentChild` on the
 * molecule; cascades through `CNGX_TABS_CONFIG.templates.overflowTrigger`
 * before falling back to the built-in `i18n.moreTabsLabel(count)` text.
 *
 * Pure marker — zero logic. The directive holds only a typed
 * {@link TemplateRef} reference. Mirrors `CngxTabLabel`'s shape.
 *
 * @example
 * ```html
 * <cngx-tab-overflow>
 *   <ng-template cngxTabOverflowTrigger let-count>
 *     <my-icon name="dots" /> +{{ count }}
 *   </ng-template>
 * </cngx-tab-overflow>
 * ```
 *
 * @category interactive
 */
@Directive({
  selector: 'ng-template[cngxTabOverflowTrigger]',
  exportAs: 'cngxTabOverflowTrigger',
  standalone: true,
})
export class CngxTabOverflowTrigger {
  readonly templateRef = inject<TemplateRef<CngxTabOverflowTriggerContext>>(
    TemplateRef,
  );
}
