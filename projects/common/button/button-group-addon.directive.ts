import { Directive } from '@angular/core';

/**
 * Gives content that is not a box of its own a segment inside a
 * `cngxButtonGroup`: an avatar, an icon, a count, a short status text. The
 * addon gets the group's border and the row height of the group's size,
 * centres its content and pads it inline with `--cngx-space-md`. Content
 * sized in `em` follows the row.
 *
 * The addon is not interactive and adds no role; its text is read in
 * document order between the buttons.
 *
 * ```html
 * <div cngxButtonGroup variant="outline" aria-label="Assignee">
 *   <span cngxButtonGroupAddon><cngx-avatar name="Ada Lovelace" size="sm" /></span>
 *   <button cngxButton>Reassign</button>
 * </div>
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-group-addon.directive.ts
 * @since 0.1.0
 * @relatedTo CngxButtonGroup, CngxButtonGroupSeparator
 * <example-url>http://localhost:4200/#/common/button/group/with-addon</example-url>
 */
@Directive({
  selector: '[cngxButtonGroupAddon]',
  standalone: true,
  host: { class: 'cngx-button-group__addon' },
})
export class CngxButtonGroupAddon {}
