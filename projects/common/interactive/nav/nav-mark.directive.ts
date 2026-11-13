import { Directive } from '@angular/core';

/**
 * Mark of a nav header or footer: a logo, an avatar or a short monogram. It
 * fills the icon box (`--cngx-nav-icon-size`) at the same x as the row icons,
 * so it stays in place when a container narrows to a rail.
 *
 * The mark is `aria-hidden`: put the name in `[cngxNavName]` next to it, which
 * stays in the accessible name.
 *
 * ```html
 * <cngx-nav-header>
 *   <img cngxNavMark src="logo.svg" alt="" />
 *   <span cngxNavName>Acme HR</span>
 * </cngx-nav-header>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/nav/nav-mark.directive.ts
 * @selector [cngxNavMark]
 * @since 0.3.0
 * @relatedTo CngxNavHeader, CngxNavFooter, CngxNavName, CngxNavLink
 * @axis level atom
 */
@Directive({
  selector: '[cngxNavMark]',
  exportAs: 'cngxNavMark',
  standalone: true,
  host: {
    class: 'cngx-nav-mark',
    'aria-hidden': 'true',
  },
})
export class CngxNavMark {}
