import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxTabHandle } from '../tab-group-host.token';

/**
 * Context passed to the `*cngxTabErrorBadge` template. Drives the
 * error-badge decoration rendered inside a tab button when the
 * tab's `errorAggregator?.shouldShow()` is `true`. Consumers swap
 * the built-in `'!'` glyph for a counter pill, custom icon, or a
 * branded marker while the surrounding visibility gate stays
 * library-owned (the badge only renders when `shouldShow()` is
 * truthy — the slot doesn't fire for tabs without aggregator
 * errors).
 *
 * Mirrors the family-standard `CngxStepBadgeContext` shape so
 * consumer-authored templates port across families with zero
 * re-authoring.
 *
 * @category interactive
 */
export interface CngxTabErrorBadgeContext {
  /** The tab handle carrying id / label / disabled / aggregator signals. */
  readonly tab: CngxTabHandle;
}

/**
 * Structural slot directive marking the error-badge template for
 * `<cngx-tab-group>`. Discovered via `contentChild` on the organism;
 * cascades through `CNGX_TABS_CONFIG.templates.errorBadge` before
 * falling back to the built-in `CNGX_TABS_GLYPHS.errorBadge` span.
 *
 * Pure marker — zero logic. Holds only a typed
 * {@link TemplateRef} reference. Mirrors the family-standard slot
 * pattern used by `CngxStepBadge` (the Phase-3 stepper sibling).
 *
 * @example
 * ```html
 * <cngx-tab-group>
 *   <ng-template cngxTabErrorBadge let-tab="tab">
 *     <span class="my-badge-pill">
 *       {{ tab.errorAggregator()?.count() }}
 *     </span>
 *   </ng-template>
 * </cngx-tab-group>
 * ```
 *
 * @category interactive
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
