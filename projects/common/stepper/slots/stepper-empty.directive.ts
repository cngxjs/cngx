import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Slot directive for the empty-state placeholder on `<cngx-stepper>`.
 * Rendered when `flatSteps()` is empty — async-loading or
 * server-driven step lists get a "no steps yet" landmark rather than
 * a collapsed strip.
 *
 * Discovered via `contentChild`; cascades through
 * `CNGX_STEPPER_CONFIG.templates.empty` before falling back to no
 * markup (Honest-Absence default).
 *
 * ```html
 * <cngx-stepper>
 *   <ng-template cngxStepperEmpty>
 *     <cngx-empty-state heading="No steps configured yet" />
 *   </ng-template>
 * </cngx-stepper>
 * ```
 * <example-url>http://localhost:4200/ui/stepper/stepper-slot-overrides/custom-busy-spinner-via-code-cngxstepbusyspinner-code</example-url>
 * <example-url>http://localhost:4200/ui/stepper/stepper-slot-overrides/custom-error-badge-via-code-cngxstepbadge-code</example-url>
 * <example-url>http://localhost:4200/ui/stepper/stepper-slot-overrides/custom-group-header-via-code-cngxstepgroupheader-code</example-url>
 * <example-url>http://localhost:4200/ui/stepper/stepper-slot-overrides/custom-indicator-glyph-via-code-cngxstepindicator-code</example-url>
 * <example-url>http://localhost:4200/ui/stepper/stepper-slot-overrides/empty-state-placeholder-via-code-cngxstepperempty-code</example-url>
 * <example-url>http://localhost:4200/ui/stepper/stepper-slot-overrides/rejection-decoration-via-code-cngxsteprejection-code</example-url>
 */
@Directive({
  selector: 'ng-template[cngxStepperEmpty]',
  exportAs: 'cngxStepperEmpty',
  standalone: true,
})
export class CngxStepperEmpty {
  readonly templateRef = inject<TemplateRef<void>>(TemplateRef);
}
