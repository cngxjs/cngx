import { Directive } from '@angular/core';

/**
 * Icon slot of a nav row. Put it on the icon inside a `cngxNavLink` or a
 * `cngxNavGroup` head; `cngx-nav.css` sizes it to `--cngx-nav-icon-size` and
 * places it in the row's icon box, at the same x in every row and every
 * container. A row without one draws its first letter in that box instead, so
 * icon rows and letter rows line up.
 *
 * The icon is `aria-hidden`: the row text is the accessible name.
 *
 * ```html
 * <a cngxNavLink href="/inbox">
 *   <cngx-icon cngxNavIcon><mat-icon>inbox</mat-icon></cngx-icon>
 *   Inbox
 * </a>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/nav/nav-icon.directive.ts
 * @selector [cngxNavIcon]
 * @since 0.3.0
 * @relatedTo CngxNavLink, CngxNavGroup
 * @axis level atom
 */
@Directive({
  selector: '[cngxNavIcon]',
  exportAs: 'cngxNavIcon',
  standalone: true,
  host: {
    class: 'cngx-nav-icon',
    'aria-hidden': 'true',
  },
})
export class CngxNavIcon {}
