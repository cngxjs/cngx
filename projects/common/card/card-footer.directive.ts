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
 * <example-url>http://localhost:4200/#/common/card/action-card-with-selection</example-url>
 * <example-url>http://localhost:4200/#/common/card/card-with-badge</example-url>
 * <example-url>http://localhost:4200/#/common/card/card-with-disclosure-expand-collapse</example-url>
 * <example-url>http://localhost:4200/#/common/card/card-with-expandable-text</example-url>
 * <example-url>http://localhost:4200/#/common/card/card-with-image</example-url>
 * <example-url>http://localhost:4200/#/common/card/card-with-speak-badge</example-url>
 * <example-url>http://localhost:4200/#/common/card/disabled-with-reason</example-url>
 * <example-url>http://localhost:4200/#/common/card/interactive-card-with-actions</example-url>
 * <example-url>http://localhost:4200/#/common/card/loading-state</example-url>
 * <example-url>http://localhost:4200/#/common/card/severity-accent</example-url>
 * <example-url>http://localhost:4200/#/common/card/title-subtitle-footer</example-url>
 */
@Directive({
  selector: 'footer[cngxCardFooter]',
  standalone: true,
  host: { class: 'cngx-card__footer' },
})
export class CngxCardFooter {}
