import { Directive, input } from '@angular/core';

/**
 * Structural slot directive for the card actions region.
 *
 * Contains independent action buttons within an interactive card.
 * Actions are separated from the card body by a divider.
 *
 * ```html
 * <cngx-card>
 *   <div cngxCardActions align="end">
 *     <button>Edit</button>
 *     <button>Delete</button>
 *   </div>
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
  selector: '[cngxCardActions]',
  standalone: true,
  host: {
    class: 'cngx-card__actions',
    '[class.cngx-card__actions--end]': 'align() === "end"',
  },
})
export class CngxCardActions {
  /** Horizontal alignment of actions. */
  readonly align = input<'start' | 'end'>('start');
}
