import { Directive } from '@angular/core';

/**
 * Structural slot directive for the card header region.
 *
 * Apply as an attribute on any element inside `<cngx-card>` to mark it
 * as the header content. Typically used on a `<header>` element.
 *
 * ```html
 * <cngx-card>
 *   <header cngxCardHeader>
 *     <h3>Title</h3>
 *   </header>
 * </cngx-card>
 * ```
 *
 * @category card
 */
@Directive({
  selector: '[cngxCardHeader]',
  standalone: true,
  host: { class: 'cngx-card__header' },
})
export class CngxCardHeader {}
