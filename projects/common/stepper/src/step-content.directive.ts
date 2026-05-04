import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Pure marker directive carrying the consumer-supplied content
 * template for a `CngxStep`. Discovered by the parent step via
 * `contentChild(CngxStepContent)`.
 *
 * Usage:
 * ```html
 * <ng-template cngxStepContent>...form fields...</ng-template>
 * ```
 *
 * @category interactive
 */
@Directive({
  selector: 'ng-template[cngxStepContent]',
  standalone: true,
})
export class CngxStepContent {
  readonly templateRef = inject(TemplateRef<unknown>);
}
