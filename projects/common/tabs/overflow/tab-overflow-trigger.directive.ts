import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxTabHandle } from '../tab-group-host.token';

/**
 * Context for the `*cngxTabOverflowTrigger` template. Replaces the
 * default `i18n.moreTabsLabel(count)` text on the More button; the
 * surrounding `<button cngxPopoverTrigger>` shell (`aria-haspopup`,
 * `aria-expanded`, click handler, hidden binding) stays library-owned.
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
 * Structural slot for the More-button label. 3-stage cascade:
 * per-instance directive >
 * `CNGX_TABS_CONFIG.templates.overflowTrigger` >
 * `i18n.moreTabsLabel(count)`.
 *
 * @example
 * ```html
 * <cngx-tab-overflow>
 *   <ng-template cngxTabOverflowTrigger let-count>
 *     <my-icon name="dots" /> +{{ count }}
 *   </ng-template>
 * </cngx-tab-overflow>
 * ```
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
