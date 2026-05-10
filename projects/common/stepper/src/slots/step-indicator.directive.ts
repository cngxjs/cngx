import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxStepNode, CngxStepStatus } from '../stepper-host.token';

/**
 * Context passed to the `*cngxStepIndicator` template. Drives the
 * numbered / checkmark / error glyph inside each step button. The
 * `<button>` shell — `aria-current`, `aria-controls`, click handler —
 * stays library-owned.
 *
 * `status` mirrors `node.state()`. `busy` is the presenter-derived
 * "this step is the in-flight commit target" flag — independent of
 * `status === 'pending'` (which is the aggregate landmark state).
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
 * Slot directive for the indicator-glyph template on `<cngx-stepper>`.
 * Discovered via `contentChild`; cascades through
 * `CNGX_STEPPER_CONFIG.templates.indicator` before falling back to
 * the built-in numeric span (`{{ position }}`).
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
