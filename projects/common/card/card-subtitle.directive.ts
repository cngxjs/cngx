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
 * <example-url>http://localhost:4200/common/card/card/action-card-with-selection</example-url>
 * <example-url>http://localhost:4200/common/card/card/card-with-badge</example-url>
 * <example-url>http://localhost:4200/common/card/card/card-with-disclosure-expand-collapse</example-url>
 * <example-url>http://localhost:4200/common/card/card/card-with-expandable-text</example-url>
 * <example-url>http://localhost:4200/common/card/card/card-with-image</example-url>
 * <example-url>http://localhost:4200/common/card/card/card-with-speak-badge</example-url>
 * <example-url>http://localhost:4200/common/card/card/disabled-with-reason</example-url>
 * <example-url>http://localhost:4200/common/card/card/interactive-card-with-actions</example-url>
 * <example-url>http://localhost:4200/common/card/card/loading-state</example-url>
 * <example-url>http://localhost:4200/common/card/card/severity-accent</example-url>
 * <example-url>http://localhost:4200/common/card/card/skeleton-loading</example-url>
 * <example-url>http://localhost:4200/common/card/card/title-subtitle-footer</example-url>
 */
@Directive({
  selector: '[cngxCardSubtitle]',
  standalone: true,
  host: { class: 'cngx-card__subtitle' },
})
export class CngxCardSubtitle {}
