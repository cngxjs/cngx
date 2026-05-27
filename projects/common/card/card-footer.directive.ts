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
 * @category common/card
 * <example-url>http://localhost:4200/#/common/card/title-subtitle-footer</example-url>
 */
@Directive({
  selector: 'footer[cngxCardFooter]',
  standalone: true,
  host: { class: 'cngx-card__footer' },
})
export class CngxCardFooter {}
