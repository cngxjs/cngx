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
 * <example-url>http://localhost:4200/common/card/action-card-with-selection</example-url>
 * <example-url>http://localhost:4200/common/card/card-with-badge</example-url>
 * <example-url>http://localhost:4200/common/card/card-with-disclosure-expand-collapse</example-url>
 * <example-url>http://localhost:4200/common/card/card-with-expandable-text</example-url>
 * <example-url>http://localhost:4200/common/card/card-with-image</example-url>
 * <example-url>http://localhost:4200/common/card/card-with-speak-badge</example-url>
 * <example-url>http://localhost:4200/common/card/disabled-with-reason</example-url>
 * <example-url>http://localhost:4200/common/card/interactive-card-with-actions</example-url>
 * <example-url>http://localhost:4200/common/card/loading-state</example-url>
 * <example-url>http://localhost:4200/common/card/severity-accent</example-url>
 * <example-url>http://localhost:4200/common/card/skeleton-loading</example-url>
 * <example-url>http://localhost:4200/common/card/title-subtitle-footer</example-url>
 */
@Directive({
  selector: '[cngxCardTitle]',
  standalone: true,
  host: { class: 'cngx-card__title' },
})
export class CngxCardTitle {}
