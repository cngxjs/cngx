import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Structural slot directive marking the empty-state placeholder
 * template for `<cngx-stepper>`. Rendered when the presenter's
 * `flatSteps()` projection is empty — async-loading consumer flows
 * (router-driven step lists, server-supplied wizard configs)
 * benefit from a clear "no steps yet" landmark rather than a
 * collapsed strip.
 *
 * Discovered via `contentChild` on the organism; cascades through
 * `CNGX_STEPPER_CONFIG.templates.empty` before falling back to no
 * markup at all (the organism renders nothing when no slot is
 * supplied — Honest-Absence default).
 *
 * Pure marker — zero logic. The directive carries no context
 * (empty state has nothing to derive from); consumers render
 * static markup or read injected services directly.
 *
 * @example
 * ```html
 * <cngx-stepper>
 *   <ng-template cngxStepperEmpty>
 *     <cngx-empty-state heading="No steps configured yet" />
 *   </ng-template>
 * </cngx-stepper>
 * ```
 *
 * @category interactive
 */
@Directive({
  selector: 'ng-template[cngxStepperEmpty]',
  exportAs: 'cngxStepperEmpty',
  standalone: true,
})
export class CngxStepperEmpty {
  readonly templateRef = inject<TemplateRef<void>>(TemplateRef);
}
