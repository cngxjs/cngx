import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxStepContentContext } from './step-panel-host.token';

/**
 * Marker directive carrying a `CngxStep`'s content template.
 * Discovered via `contentChild(CngxStepContent)`. Typed with
 * {@link CngxStepContentContext} so `let-busy="busy"` etc. gives
 * typed access to live step state.
 *
 * ```html
 * <ng-template cngxStepContent let-busy="busy">
 *   <input [disabled]="busy">
 * </ng-template>
 * ```
 * @example-url http://localhost:4200/mat-stepper-router-sync/deep-linking-against-material
 * @example-url http://localhost:4200/stepper-custom-labels/mixing-code-label-code-input-with-code-cngxsteplabel-code-slot
 * @example-url http://localhost:4200/stepper-error-aggregation/per-step-error-badges
 * @example-url http://localhost:4200/stepper-hierarchical/group-nested-steps-trailing-root-step
 * @example-url http://localhost:4200/stepper-horizontal/three-step-wizard
 * @example-url http://localhost:4200/stepper-linear/linear-gating-with-completion-checkboxes
 * @example-url http://localhost:4200/stepper-router-sync/deep-linking-with-fragment-queryparam-modes
 * @example-url http://localhost:4200/stepper-vertical/vertical-sidebar-layout
 */
@Directive({
  selector: 'ng-template[cngxStepContent]',
  standalone: true,
})
export class CngxStepContent {
  readonly templateRef = inject<TemplateRef<CngxStepContentContext>>(TemplateRef);
}
