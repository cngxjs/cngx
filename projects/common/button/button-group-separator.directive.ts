import { Directive } from '@angular/core';

/**
 * A visual divider between segments of a `cngxButtonGroup`, drawn as a
 * border so it survives forced colors. It follows the group orientation
 * (a vertical line in a row, a horizontal one in a column) and keeps the
 * segments on both sides apart instead of collapsing their seam.
 *
 * Decorative only: the host is `aria-hidden="true"`. When the split carries
 * meaning, use two labelled groups instead.
 *
 * ```html
 * <div cngxButtonGroup variant="ghost" aria-label="Clipboard">
 *   <button cngxButton>Cut</button>
 *   <button cngxButton>Copy</button>
 *   <span cngxButtonGroupSeparator></span>
 *   <button cngxButton>Paste</button>
 * </div>
 * ```
 *
 * @category common/button
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-group-separator.directive.ts
 * @since 0.1.0
 * @relatedTo CngxButtonGroup, CngxButtonGroupAddon
 * <example-url>http://localhost:4200/#/common/button/group/basic</example-url>
 */
@Directive({
  selector: '[cngxButtonGroupSeparator]',
  standalone: true,
  host: { class: 'cngx-button-group__separator', 'aria-hidden': 'true' },
})
export class CngxButtonGroupSeparator {}
