import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxTabHandle } from '../tab-group-host.token';

/**
 * Context for the `*cngxTabIcon` template. \
 * Rendered once per tab in the header, ahead of the label. \
 * Carries the tab handle plus the two
 * per-tab signals a consumer icon usually keys off - whether the tab is
 * the active one and its positional index.
 *
 * Richer than {@link CngxTabErrorBadgeContext} (which only needs `tab`) because an
 * icon commonly swaps glyph on the active tab.
 *
 * @category common/tabs/slots
 */
export interface CngxTabIconContext {
  /** The tab handle carrying id / label / disabled / aggregator signals. */
  readonly tab: CngxTabHandle;
  /** Whether this tab is the currently active one. */
  readonly active: boolean;
  /** Zero-based position of the tab in the strip. */
  readonly index: number;
}

/**
 * Structural slot for the tab-icon template. \
 * One group-level slot with per-tab context (stepper-slot parity), not a per-`CngxTab` input.\
 * 3-stage cascade: 
 * per-instance directive > `CNGX_TABS_CONFIG.templates.icon` > none (no icon rendered).
 *
 * ```html
 * <ng-template cngxTabIcon let-active="active">
 *   <cngx-icon [name]="active ? 'folder-open' : 'folder'" />
 * </ng-template>
 * ```
 *
 * @category common/tabs/slots
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/tabs/slots/tab-icon.directive.ts
 * @since 0.1.0
 * @relatedTo CngxTabErrorBadge, CngxTab, CngxTabGroup
 * <example-url>http://localhost:4200/#/ui/tabs/tab-icons/icon-end</example-url>
 * <example-url>http://localhost:4200/#/ui/tabs/tab-icons/icon-only</example-url>
 * <example-url>http://localhost:4200/#/ui/tabs/tab-icons/icon-start</example-url>
 * <example-url>http://localhost:4200/#/ui/tabs/tab-icons/icon-top</example-url>
 * <example-url>http://localhost:4200/#/ui/tabs/tab-icons/icon-vertical-sidebar</example-url>
 */
@Directive({
  selector: 'ng-template[cngxTabIcon]',
  exportAs: 'cngxTabIcon',
  standalone: true,
})
export class CngxTabIcon {
  readonly templateRef = inject<TemplateRef<CngxTabIconContext>>(TemplateRef);
}
