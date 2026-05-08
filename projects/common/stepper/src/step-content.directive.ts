import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxStepContentContext } from './step-panel-host.token';

/**
 * Pure marker directive carrying the consumer-supplied content
 * template for a `CngxStep`. Discovered by the parent step via
 * `contentChild(CngxStepContent)`.
 *
 * The template is typed with {@link CngxStepContentContext} so
 * consumer markup gets typed access to live step state via
 * `let-node="node" let-busy="busy"` etc. — useful for gating inner
 * controls on `disabled` / `busy` without re-reading the host.
 *
 * Usage:
 * ```html
 * <ng-template cngxStepContent let-busy="busy">
 *   <input [disabled]="busy">
 * </ng-template>
 * ```
 *
 * @category interactive/stepper
 */
@Directive({
  selector: 'ng-template[cngxStepContent]',
  standalone: true,
})
export class CngxStepContent {
  readonly templateRef = inject<TemplateRef<CngxStepContentContext>>(TemplateRef);
}
