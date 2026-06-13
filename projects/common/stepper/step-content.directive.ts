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
 *
 * @category common/stepper
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/stepper/step-content.directive.ts
 * @since 0.1.0
 * @relatedTo CngxStep, CngxStepLabel
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-step-content/typed-lazy-panels</example-url>
 */
@Directive({
  selector: 'ng-template[cngxStepContent]',
  standalone: true,
})
export class CngxStepContent {
  readonly templateRef = inject<TemplateRef<CngxStepContentContext>>(TemplateRef);
}
