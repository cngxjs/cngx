import { Directive } from '@angular/core';

/**
 * Bottom region of a navigation container. It takes the free space above it
 * (`margin-block-start: auto`), so it sits at the bottom of a column
 * container, with a divider and muted, smaller text from `cngx-nav.css`
 * through the `--cngx-nav-footer-*` tokens. Put `[cngxNavMark]` and
 * `[cngxNavName]` inside for an avatar or account row that lines up with the
 * nav rows.
 *
 * Two selector forms: the `<cngx-nav-footer>` element, or `[cngxNavFooter]`
 * on a native `<footer>`.
 *
 * ```html
 * <cngx-nav-footer>
 *   <span cngxNavMark>JD</span>
 *   <span cngxNavName>Jane Doe</span>
 * </cngx-nav-footer>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/nav/nav-footer.directive.ts
 * @selector cngx-nav-footer
 * @since 0.3.0
 * @relatedTo CngxNavHeader, CngxNavMark, CngxNavName, CngxNavLink
 * @axis level atom
 */
@Directive({
  selector: 'cngx-nav-footer, [cngxNavFooter]',
  exportAs: 'cngxNavFooter',
  standalone: true,
  host: { class: 'cngx-nav-footer' },
})
export class CngxNavFooter {}
