import { Directive } from '@angular/core';

/**
 * Marks an element as the card's subtitle — secondary text below the title.
 *
 * ```html
 * <cngx-card>
 *   <header cngxCardHeader>
 *     <h3 cngxCardTitle>Maria Muster</h3>
 *     <span cngxCardSubtitle>Zimmer 12, Station 3A</span>
 *   </header>
 * </cngx-card>
 * ```
 *
 * @category card
 */
@Directive({
  selector: '[cngxCardSubtitle]',
  standalone: true,
  host: { class: 'cngx-card__subtitle' },
})
export class CngxCardSubtitle {}
