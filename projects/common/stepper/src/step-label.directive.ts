import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Pure marker directive carrying the consumer-supplied label
 * template for a `CngxStep`. Discovered by the parent step via
 * `contentChild(CngxStepLabel)`.
 *
 * Usage:
 * ```html
 * <ng-template cngxStepLabel>Customer details</ng-template>
 * ```
 *
 * @category interactive
 */
@Directive({
  selector: 'ng-template[cngxStepLabel]',
  standalone: true,
})
export class CngxStepLabel {
  readonly templateRef = inject(TemplateRef<unknown>);
}
