import { Directive } from '@angular/core';

/**
 * Structural slot directive for the card body region.
 *
 * ```html
 * <cngx-card>
 *   <div cngxCardBody>Main content here</div>
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
  selector: '[cngxCardBody]',
  standalone: true,
  host: { class: 'cngx-card__body' },
})
export class CngxCardBody {}
