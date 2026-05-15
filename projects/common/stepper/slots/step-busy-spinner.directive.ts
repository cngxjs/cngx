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
 * ```html
 * <cngx-stepper>
 *   <ng-template cngxStepBusySpinner>
 *     <my-spinner size="sm" />
 *   </ng-template>
 * </cngx-stepper>
 * ```
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-slot-overrides/custom-busy-spinner-via-code-cngxstepbusyspinner-code</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-slot-overrides/custom-error-badge-via-code-cngxstepbadge-code</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-slot-overrides/custom-group-header-via-code-cngxstepgroupheader-code</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-slot-overrides/custom-indicator-glyph-via-code-cngxstepindicator-code</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-slot-overrides/empty-state-placeholder-via-code-cngxstepperempty-code</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-slot-overrides/rejection-decoration-via-code-cngxsteprejection-code</example-url>
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
