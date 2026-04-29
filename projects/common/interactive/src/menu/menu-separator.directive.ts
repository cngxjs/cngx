import { Directive } from '@angular/core';

/**
 * Visual + semantic separator inside a `CngxMenu`. Renders `role="separator"`
 * with `aria-orientation="horizontal"`. Does **not** register `CNGX_AD_ITEM`,
 * so the surrounding `CngxActiveDescendant` skips it during arrow-key
 * navigation and typeahead — required for action-menu and dropdown-menu
 * patterns where separators visually group items but are not selectable.
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxMenuSeparator]',
  exportAs: 'cngxMenuSeparator',
  standalone: true,
  host: {
    role: 'separator',
    'aria-orientation': 'horizontal',
  },
})
export class CngxMenuSeparator {}
