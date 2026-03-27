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
 * @category card
 */
@Directive({
  selector: '[cngxCardBody]',
  standalone: true,
  host: { class: 'cngx-card__body' },
})
export class CngxCardBody {}
