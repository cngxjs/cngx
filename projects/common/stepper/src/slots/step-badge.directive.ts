import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxStepNode } from '../stepper-host.token';

/**
 * Context passed to the `*cngxStepBadge` template. Drives the
 * error-badge decoration rendered inside a step button when the
 * step's `errorAggregator?.shouldShow()` is `true`. Consumers swap
 * the built-in `'!'` glyph for a counter pill, custom icon, or a
 * branded marker while the surrounding visibility gate stays
 * library-owned (the badge only renders when `shouldShow()` is
 * truthy — the slot doesn't fire for steps without aggregator
 * errors).
 *
 * `count` mirrors the aggregated error count exposed by the
 * step's aggregator contract; consumers typeahead-bind it as a
 * counter on the badge surface.
 *
 * @category interactive
 */
export interface CngxStepBadgeContext {
  /** Aggregated error count for this step (≥ 1 when shown). */
  readonly count: number;
  /** The step node carrying id / label / state signals. */
  readonly node: CngxStepNode;
}

/**
 * Structural slot directive marking the error-badge template for
 * `<cngx-stepper>`. Discovered via `contentChild` on the organism;
 * cascades through `CNGX_STEPPER_CONFIG.templates.badge` before
 * falling back to the built-in `CNGX_STEPPER_GLYPHS.errorBadge`
 * span.
 *
 * Pure marker — zero logic. Holds only a typed
 * {@link TemplateRef} reference. Mirrors the family-standard slot
 * pattern used by `CngxTabOverflowTrigger` and the (Phase 4)
 * `CngxTabErrorBadge` sibling.
 *
 * @example
 * ```html
 * <cngx-stepper>
 *   <ng-template cngxStepBadge let-count="count">
 *     <span class="my-badge-pill">{{ count }}</span>
 *   </ng-template>
 * </cngx-stepper>
 * ```
 *
 * @category interactive
 */
@Directive({
  selector: 'ng-template[cngxStepBadge]',
  exportAs: 'cngxStepBadge',
  standalone: true,
})
export class CngxStepBadge {
  readonly templateRef = inject<TemplateRef<CngxStepBadgeContext>>(TemplateRef);
}
