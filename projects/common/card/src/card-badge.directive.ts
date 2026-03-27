import { Directive, input } from '@angular/core';

/**
 * Positions a badge element at a corner of its parent card.
 *
 * Typically used for status indicators (P-badges, notification dots)
 * that float in the card's top-right corner.
 *
 * @usageNotes
 *
 * ```html
 * <cngx-card>
 *   <cngx-status-badge cngxCardBadge status="pending" variant="dot" />
 *   <header cngxCardHeader>Pflegeplan</header>
 * </cngx-card>
 * ```
 *
 * @category card
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
