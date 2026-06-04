import { Directive } from '@angular/core';

/**
 * Structural slot directive for the card body region.
 *
 * ```html
 * <cngx-card>
 *   <div cngxCardBody>Main content here</div>
 * </cngx-card>
 * ```
 *
 * @category common/card
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/card/card-body.directive.ts
 * @since 0.1.0
 * @relatedTo CngxCard, CngxCardHeader, CngxCardFooter
 */
@Directive({
  selector: '[cngxCardBody]',
  standalone: true,
  host: { class: 'cngx-card__body' },
})
export class CngxCardBody {}
