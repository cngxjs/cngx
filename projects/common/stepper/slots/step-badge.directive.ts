import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxStepNode } from '../stepper-host.token';

/**
 * Context passed to the `*cngxStepBadge` template. Drives the error
 * badge inside a step button when `errorAggregator?.shouldShow()` is
 * truthy. Consumers swap the built-in `'!'` glyph for a counter pill
 * or branded marker; the visibility gate stays library-owned.
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
 * Slot directive for the error-badge template on `<cngx-stepper>`.
 * Discovered via `contentChild`; cascades through
 * `CNGX_STEPPER_CONFIG.templates.badge` before falling back to
 * `CNGX_STEPPER_GLYPHS.errorBadge`.
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
