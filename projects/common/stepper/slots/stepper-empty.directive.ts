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
 */
@Directive({
  selector: 'ng-template[cngxStepperEmpty]',
  exportAs: 'cngxStepperEmpty',
  standalone: true,
})
export class CngxStepperEmpty {
  readonly templateRef = inject<TemplateRef<void>>(TemplateRef);
}
