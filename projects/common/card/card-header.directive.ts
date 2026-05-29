import { Directive } from '@angular/core';

/**
 * Structural slot directive for the card header region.
 *
 * Must be placed on a native `<header>` element - the selector enforces
 * semantic correctness at compile time.
 *
 * ```html
 * <cngx-card>
 *   <header cngxCardHeader>
 *     <h3 cngxCardTitle>Title</h3>
 *   </header>
 * </cngx-card>
 * ```
 *
 * @category common/card
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/card/card-header.directive.ts
 * @since 0.1.0
 * @relatedTo CngxCard, CngxCardTitle, CngxCardSubtitle, CngxCardFooter
 */
@Directive({
  selector: 'header[cngxCardHeader]',
  standalone: true,
  host: { class: 'cngx-card__header' },
})
export class CngxCardHeader {}
