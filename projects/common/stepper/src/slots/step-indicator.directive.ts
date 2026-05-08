import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxStepNode, CngxStepStatus } from '../stepper-host.token';

/**
 * Context passed to the `*cngxStepIndicator` template. Drives the
 * numbered / checkmark / error glyph rendered inside each step button
 * — the visible badge that signals "step N", "completed", "in progress",
 * or "failed". Consumers swap the built-in numeric span for any
 * markup (icon set, custom checkmark, branded glyph) while the
 * surrounding `<button>` shell — including `aria-current`,
 * `aria-controls`, click handler — stays library-owned.
 *
 * Status comes from `node.state()` (a {@link CngxStepStatus}); `busy`
 * is the presenter-derived "this step is the in-flight commit target"
 * flag that drives a spinner overlay independent of `status === 'pending'`
 * (the latter is the aggregate landmark state).
 *
 * @category interactive
 */
export interface CngxStepIndicatorContext {
  /** Convenience alias for `position` — usable as `let-position` shorthand. */
  readonly $implicit: number;
  /** 1-based position of this step in the flat step-only projection. */
  readonly position: number;
  /** The step node carrying id / label / disabled / state signals. */
  readonly node: CngxStepNode;
  /** `true` when this step is the current `activeStepId`. */
  readonly active: boolean;
  /** Live step status — drives the visual variant (idle / success / error / busy). */
  readonly status: CngxStepStatus;
  /** `true` when this step is the in-flight commit target. */
  readonly busy: boolean;
}

/**
 * Structural slot directive marking the indicator-glyph template
 * for `<cngx-stepper>`. Discovered via `contentChild` on the organism;
 * cascades through `CNGX_STEPPER_CONFIG.templates.indicator` before
 * falling back to the built-in numeric span (`{{ position }}`).
 *
 * Pure marker — zero logic. The directive holds only a typed
 * {@link TemplateRef} reference. Mirrors `CngxTabOverflowTrigger`'s
 * shape and the family-standard slot pattern.
 *
 * @example
 * ```html
 * <cngx-stepper>
 *   <ng-template cngxStepIndicator let-position let-node="node" let-status="status">
 *     @if (status === 'success') {
 *       <my-icon name="check" />
 *     } @else if (status === 'error') {
 *       <my-icon name="alert" />
 *     } @else {
 *       <span class="my-step-num">{{ position }}</span>
 *     }
 *   </ng-template>
 * </cngx-stepper>
 * ```
 *
 * @category interactive
 */
@Directive({
  selector: 'ng-template[cngxStepIndicator]',
  exportAs: 'cngxStepIndicator',
  standalone: true,
})
export class CngxStepIndicator {
  readonly templateRef = inject<TemplateRef<CngxStepIndicatorContext>>(
    TemplateRef,
  );
}
