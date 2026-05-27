import { Directive } from '@angular/core';

/**
 * Top region of `<cngx-sidenav>`. Sits before the scrolling body in
 * the sidenav's flex column, so it stays pinned at the top while the
 * body scrolls. Not `position: sticky` - a non-shrinking flex sibling
 * with `flex-shrink: 0`.
 *
 * Two selector forms:
 * - `<cngx-sidenav-header>` element wrapper for arbitrary content.
 * - `[cngxSidenavHeader]` attribute for native landmarks like
 *   `<header>` so the landmark a11y comes from the element itself.
 *
 * Adds the `cngx-sidenav-header` class for theming via
 * `--cngx-sidenav-header-bg` and `--cngx-sidenav-header-font-size`.
 *
 * In `mini` mode (collapsed rail, not expanded) the region clips to
 * `miniWidth` with `overflow: hidden`, centred text, and tight
 * padding. Design the projected content to survive the rail width:
 * an icon-sized logo works, a wordmark gets cropped.
 *
 * Typical content: logo, app name, close trigger.
 *
 * ```html
 * <cngx-sidenav>
 *   <cngx-sidenav-header>Acme HR</cngx-sidenav-header>
 *   ...
 * </cngx-sidenav>
 * ```
 *
 * @category ui/sidenav
 */
@Directive({
  selector: 'cngx-sidenav-header, [cngxSidenavHeader]',
  standalone: true,
  host: { '[class.cngx-sidenav-header]': 'true' },
})
export class CngxSidenavHeader {}
