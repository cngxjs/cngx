import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxStepLabelContext } from './step-panel-host.token';

/**
 * Pure marker directive carrying the consumer-supplied label
 * template for a `CngxStep`. Discovered by the parent step via
 * `contentChild(CngxStepLabel)`.
 *
 * The template is typed with {@link CngxStepLabelContext} so
 * consumer markup gets typed access to live step state via
 * `let-node="node" let-active="active"` etc.
 *
 * Usage:
 * ```html
 * <ng-template cngxStepLabel let-node="node">
 *   {{ node.label() }}
 * </ng-template>
 * ```
 *
 * @category interactive/stepper
 */
@Directive({
  selector: 'ng-template[cngxStepLabel]',
  standalone: true,
})
export class CngxStepLabel {
  readonly templateRef = inject<TemplateRef<CngxStepLabelContext>>(TemplateRef);
}
