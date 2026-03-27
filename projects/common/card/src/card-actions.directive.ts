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
 *
 * @category card
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
