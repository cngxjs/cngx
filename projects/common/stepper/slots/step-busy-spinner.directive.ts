import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxStepNode } from '../stepper-host.token';

/**
 * Context passed to the `*cngxStepBusySpinner` template. Drives the
 * pending-commit overlay on the in-flight target step. Renders only
 * when the step matches `presenter.intendedStepIndex()` with
 * `commitState.status() === 'pending'`.
 */
export interface CngxStepBusySpinnerContext {
  /** The step node carrying id / label / state signals. */
  readonly node: CngxStepNode;
}

/**
 * Slot directive for the busy-spinner template on `<cngx-stepper>`.
 * Discovered via `contentChild`; cascades through
 * `CNGX_STEPPER_CONFIG.templates.busySpinner` before falling back to
 * the built-in pulse-animation span.
 *
 * @example
 * ```html
 * <cngx-stepper>
 *   <ng-template cngxStepBusySpinner>
 *     <my-spinner size="sm" />
 *   </ng-template>
 * </cngx-stepper>
 * ```
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
