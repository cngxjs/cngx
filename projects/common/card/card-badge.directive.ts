import { Directive, input } from '@angular/core';

/**
 * Positions a badge element at a corner of its parent card.
 *
 * Typically used for status indicators (P-badges, notification dots)
 * that float in the card's top-right corner.
 *
 * ```html
 * <cngx-card>
 *   <cngx-status-badge cngxCardBadge status="pending" variant="dot" />
 *   <header cngxCardHeader>Pflegeplan</header>
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
  selector: '[cngxCardBadge]',
  standalone: true,
  host: {
    class: 'cngx-card__badge',
    '[class.cngx-card__badge--top-start]': 'position() === "top-start"',
    '[class.cngx-card__badge--top-end]': 'position() === "top-end"',
    '[class.cngx-card__badge--bottom-start]': 'position() === "bottom-start"',
    '[class.cngx-card__badge--bottom-end]': 'position() === "bottom-end"',
  },
})
export class CngxCardBadge {
  /** Corner position using logical properties. */
  readonly position = input<'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'>('top-end');
}
