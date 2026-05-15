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
 * <example-url>http://localhost:4200/card/action-card-with-selection</example-url>
 * <example-url>http://localhost:4200/card/card-with-badge</example-url>
 * <example-url>http://localhost:4200/card/card-with-disclosure-expand-collapse</example-url>
 * <example-url>http://localhost:4200/card/card-with-expandable-text</example-url>
 * <example-url>http://localhost:4200/card/card-with-image</example-url>
 * <example-url>http://localhost:4200/card/card-with-speak-badge</example-url>
 * <example-url>http://localhost:4200/card/disabled-with-reason</example-url>
 * <example-url>http://localhost:4200/card/interactive-card-with-actions</example-url>
 * <example-url>http://localhost:4200/card/loading-state</example-url>
 * <example-url>http://localhost:4200/card/severity-accent</example-url>
 * <example-url>http://localhost:4200/card/skeleton-loading</example-url>
 * <example-url>http://localhost:4200/card/title-subtitle-footer</example-url>
 */
@Directive({
  selector: '[cngxCardSubtitle]',
  standalone: true,
  host: { class: 'cngx-card__subtitle' },
})
export class CngxCardSubtitle {}
