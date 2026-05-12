import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxTabHandle } from '../tab-group-host.token';

/**
 * Context for the `*cngxTabErrorBadge` template. Renders only when
 * the tab's `errorAggregator?.shouldShow()` is `true`; the visibility
 * gate stays library-owned. Sibling shape to `CngxStepBadgeContext`.
 */
export interface CngxTabErrorBadgeContext {
  /** The tab handle carrying id / label / disabled / aggregator signals. */
  readonly tab: CngxTabHandle;
}

/**
 * Structural slot for the error-badge template. 3-stage cascade:
 * per-instance directive >
 * `CNGX_TABS_CONFIG.templates.errorBadge` >
 * `CNGX_TABS_GLYPHS.errorBadge`.
 *
 * ```html
 * <cngx-tab-group>
 *   <ng-template cngxTabErrorBadge let-tab="tab">
 *     <span class="my-badge-pill">
 *       {{ tab.errorAggregator()?.count() }}
 *     </span>
 *   </ng-template>
 * </cngx-tab-group>
 * ```
 */
@Directive({
  selector: 'ng-template[cngxTabErrorBadge]',
  exportAs: 'cngxTabErrorBadge',
  standalone: true,
})
export class CngxTabErrorBadge {
  readonly templateRef = inject<TemplateRef<CngxTabErrorBadgeContext>>(
    TemplateRef,
  );
}
