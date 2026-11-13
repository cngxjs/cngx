import { Directive } from '@angular/core';

/**
 * Name of a nav header or footer, next to `[cngxNavMark]`. It starts at the
 * label x of the rows and truncates with an ellipsis when the container is
 * too narrow. It carries the text assistive technology reads; the mark beside
 * it is `aria-hidden`.
 *
 * ```html
 * <cngx-nav-footer>
 *   <span cngxNavMark>JD</span>
 *   <span cngxNavName>Jane Doe</span>
 * </cngx-nav-footer>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/nav/nav-name.directive.ts
 * @selector [cngxNavName]
 * @since 0.3.0
 * @relatedTo CngxNavHeader, CngxNavFooter, CngxNavMark, CngxNavLink
 * @axis level atom
 */
@Directive({
  selector: '[cngxNavName]',
  exportAs: 'cngxNavName',
  standalone: true,
  host: { class: 'cngx-nav-name' },
})
export class CngxNavName {}
