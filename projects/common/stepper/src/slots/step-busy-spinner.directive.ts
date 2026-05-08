import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxStepNode } from '../stepper-host.token';

/**
 * Context passed to the `*cngxStepBusySpinner` template. Drives the
 * commit-pending spinner overlay rendered inside the step button
 * that is the in-flight commit target. Consumers swap the built-in
 * `<span class="cngx-stepper__busy-spinner">` for a branded
 * spinner, a CSS animation, or a `<cngx-skeleton>` while the
 * visibility gate stays library-owned (the slot only renders when
 * the step matches `presenter.intendedStepIndex()` with
 * `commitState.status() === 'pending'`).
 *
 * @category interactive
 */
export interface CngxStepBusySpinnerContext {
  /** The step node carrying id / label / state signals. */
  readonly node: CngxStepNode;
}

/**
 * Structural slot directive marking the busy-spinner template for
 * `<cngx-stepper>`. Discovered via `contentChild` on the organism;
 * cascades through `CNGX_STEPPER_CONFIG.templates.busySpinner`
 * before falling back to the built-in pulse-animation span.
 *
 * Pure marker — zero logic. Holds only a typed
 * {@link TemplateRef} reference. Mirrors the family-standard slot
 * pattern.
 *
 * @example
 * ```html
 * <cngx-stepper>
 *   <ng-template cngxStepBusySpinner>
 *     <my-spinner size="sm" />
 *   </ng-template>
 * </cngx-stepper>
 * ```
 *
 * @category interactive
 */
@Directive({
  selector: 'ng-template[cngxStepBusySpinner]',
  exportAs: 'cngxStepBusySpinner',
  standalone: true,
})
export class CngxStepBusySpinner {
  readonly templateRef = inject<TemplateRef<CngxStepBusySpinnerContext>>(
    TemplateRef,
  );
}
