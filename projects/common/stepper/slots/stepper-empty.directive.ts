import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Slot directive for the empty-state placeholder on `<cngx-stepper>`.
 * Rendered when `flatSteps()` is empty - async-loading or
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
 *
 * @category common/stepper/slots
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/stepper/slots/stepper-empty.directive.ts
 * @since 0.1.0
 * @relatedTo CngxStepIndicator, CngxStepGroupHeader
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-slot-overrides/empty-state-placeholder-via-code-cngxstepperempty-code</example-url>
 */
@Directive({
  selector: 'ng-template[cngxStepperEmpty]',
  exportAs: 'cngxStepperEmpty',
  standalone: true,
})
export class CngxStepperEmpty {
  readonly templateRef = inject<TemplateRef<void>>(TemplateRef);
}
