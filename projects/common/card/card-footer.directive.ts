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
  selector: 'footer[cngxCardFooter]',
  standalone: true,
  host: { class: 'cngx-card__footer' },
})
export class CngxCardFooter {}
