import { Directive } from '@angular/core';

/**
 * Bottom region of `<cngx-sidenav>`. Mirror of `CngxSidenavHeader`:
 * a non-shrinking flex sibling after the scrolling body, so it stays
 * pinned at the bottom while the body scrolls. Not `position:
 * sticky`.
 *
 * Two selector forms:
 * - `<cngx-sidenav-footer>` element wrapper for arbitrary content.
 * - `[cngxSidenavFooter]` attribute for native landmarks like
 *   `<footer>` so the landmark a11y comes from the element itself.
 *
 * Adds the `cngx-sidenav-footer` class for theming via
 * `--cngx-sidenav-footer-bg`, `--cngx-sidenav-footer-border-color`,
 * and `--cngx-sidenav-footer-font-size`.
 *
 * In `mini` mode (collapsed rail, not expanded) the region clips to
 * `miniWidth` with `overflow: hidden` and centred text - same
 * caveat as the header. An icon + tooltip pattern survives the
 * rail; a multi-line copyright line does not.
 *
 * Typical content: version badge, account menu trigger, secondary
 * nav, sign-out button.
 *
 * ```html
 * <cngx-sidenav>
 *   ...
 *   <cngx-sidenav-footer>v2.4.0</cngx-sidenav-footer>
 * </cngx-sidenav>
 * ```
 *
 * @category ui/sidenav
 */
@Directive({
  selector: 'cngx-sidenav-footer, [cngxSidenavFooter]',
  standalone: true,
  host: { '[class.cngx-sidenav-footer]': 'true' },
})
export class CngxSidenavFooter {}
