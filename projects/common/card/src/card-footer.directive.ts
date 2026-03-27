import { Directive } from '@angular/core';

/**
 * Structural slot directive for the card footer region.
 *
 * Must be placed on a native `<footer>` element — the selector enforces
 * semantic correctness at compile time.
 *
 * ```html
 * <cngx-card>
 *   <footer cngxCardFooter>Footer content</footer>
 * </cngx-card>
 * ```
 *
 * @category card
 */
@Directive({
  selector: 'footer[cngxCardFooter]',
  standalone: true,
  host: { class: 'cngx-card__footer' },
})
export class CngxCardFooter {}
