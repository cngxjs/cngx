import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxTabHandle } from '../tab-group-host.token';

/**
 * Context for the `*cngxTabOverflowItem` template. Replaces the
 * default `tab.label() ?? tab.id` text inside the More popover; the
 * surrounding `<li role="menuitem">` shell (`aria-disabled`, click
 * handler, `data-tab-id`) stays library-owned.
 *
 * @category common/tabs/overflow
 */
export interface CngxTabOverflowItemContext {
  /** Convenience alias for `tab` — usable as `let-tab` shorthand. */
  readonly $implicit: CngxTabHandle;
  /** The hidden tab the row represents. */
  readonly tab: CngxTabHandle;
  /**
   * Commit-aware select. Routes through `panelHost.selectById(tab.id)`
   * and dismisses the popover; no-op when `disabled`.
   */
  readonly pick: () => void;
  /** Mirrors `tab.disabled()` — pre-resolved for consumer convenience. */
  readonly disabled: boolean;
  /** Row index inside `hiddenTabs()`, starting at 0. */
  readonly index: number;
}

/**
 * Structural slot for the per-row body inside the More popover.
 * 3-stage cascade: per-instance directive >
 * `CNGX_TABS_CONFIG.templates.overflowItem` > built-in label text.
 *
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
 * @category common/tabs/overflow
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
