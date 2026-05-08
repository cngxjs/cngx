import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxTabHandle } from '../tab-group-host.token';

/**
 * Context passed to the `*cngxTabOverflowItem` template. Drives the
 * per-row body inside the More popover; consumers replace the default
 * `tab.label() ?? tab.id` text with arbitrary markup (icon + label
 * + secondary metadata, kbd hint, etc.) while the surrounding
 * `<li role="menuitem">` shell — including `aria-disabled`, click
 * handler, `data-tab-id` — stays library-owned.
 *
 * @category interactive
 */
export interface CngxTabOverflowItemContext {
  /** Convenience alias for `tab` — usable as `let-tab` shorthand. */
  readonly $implicit: CngxTabHandle;
  /** The hidden tab the row represents. */
  readonly tab: CngxTabHandle;
  /**
   * Commit-aware select callback — invoking it routes through
   * `panelHost.selectById(tab.id)` and dismisses the popover. No-op
   * when the tab is disabled. Equivalent to clicking the default row.
   */
  readonly pick: () => void;
  /** Mirrors `tab.disabled()` — pre-resolved for consumer convenience. */
  readonly disabled: boolean;
  /** Row index inside `hiddenTabs()`, starting at 0. */
  readonly index: number;
}

/**
 * Structural slot directive marking the per-row body template for
 * each hidden tab inside `<cngx-tab-overflow>`'s popover. Discovered
 * via `contentChild` on the molecule; cascades through
 * `CNGX_TABS_CONFIG.templates.overflowItem` before falling back to
 * the built-in label text.
 *
 * Pure marker — zero logic. Holds only a typed {@link TemplateRef}.
 *
 * @example
 * ```html
 * <cngx-tab-overflow>
 *   <ng-template cngxTabOverflowItem let-tab let-disabled="disabled">
 *     <my-icon [name]="tab.id" />
 *     <span class="row-label" [class.is-muted]="disabled">
 *       {{ tab.label() }}
 *     </span>
 *   </ng-template>
 * </cngx-tab-overflow>
 * ```
 *
 * @category interactive
 */
@Directive({
  selector: 'ng-template[cngxTabOverflowItem]',
  exportAs: 'cngxTabOverflowItem',
  standalone: true,
})
export class CngxTabOverflowItem {
  readonly templateRef = inject<TemplateRef<CngxTabOverflowItemContext>>(
    TemplateRef,
  );
}
