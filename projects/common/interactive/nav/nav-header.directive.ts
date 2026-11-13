import { Directive } from '@angular/core';

/**
 * Top region of a navigation container (`<cngx-sidenav>`, a `cngxSidebar`, a
 * plain `<nav>`). A non-shrinking block that stays put while the rows below
 * it scroll. Put `[cngxNavMark]` and `[cngxNavName]` inside: the mark sits in
 * the icon box at the same x as the row icons, the name follows at the label
 * x. Header padding, background, border and type come from `cngx-nav.css`
 * through the `--cngx-nav-header-*` tokens.
 *
 * Two selector forms: the `<cngx-nav-header>` element, or `[cngxNavHeader]`
 * on a native `<header>` so the landmark comes from the element itself.
 *
 * ```html
 * <cngx-nav-header>
 *   <span cngxNavMark>A</span>
 *   <span cngxNavName>Acme HR</span>
 * </cngx-nav-header>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/nav/nav-header.directive.ts
 * @selector cngx-nav-header
 * @since 0.3.0
 * @relatedTo CngxNavFooter, CngxNavMark, CngxNavName, CngxNavLink
 * @axis level atom
 */
@Directive({
  selector: 'cngx-nav-header, [cngxNavHeader]',
  exportAs: 'cngxNavHeader',
  standalone: true,
  host: { class: 'cngx-nav-header' },
})
export class CngxNavHeader {}
