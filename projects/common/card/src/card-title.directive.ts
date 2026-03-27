import { Directive } from '@angular/core';

/**
 * Marks an element as the card's primary title.
 *
 * Provides consistent font sizing and weight. Typically placed on
 * a heading element inside `[cngxCardHeader]`.
 *
 * ```html
 * <cngx-card>
 *   <header cngxCardHeader>
 *     <h3 cngxCardTitle>Patient Overview</h3>
 *     <span cngxCardSubtitle>Room 12</span>
 *   </header>
 * </cngx-card>
 * ```
 *
 * @category card
 */
@Directive({
  selector: '[cngxCardTitle]',
  standalone: true,
  host: { class: 'cngx-card__title' },
})
export class CngxCardTitle {}
