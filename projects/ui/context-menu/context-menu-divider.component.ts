import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

import { CngxMenuSeparator } from '@cngx/common/interactive';

/**
 * Non-interactive separator between context-menu item groups. Thin shell over
 * `CngxMenuSeparator` (`role="separator"`, `aria-orientation="horizontal"`),
 * skipped by active-descendant navigation and typeahead. Dual selector: use as
 * an element or as an attribute on a native `<hr>`.
 *
 * ```html
 * <cngx-context-menu-divider />
 * <hr cngxContextMenuDivider />
 * ```
 *
 * @category ui/context-menu
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/context-menu/context-menu-divider.component.ts
 * @since 0.1.0
 * @relatedTo CngxContextMenu, CngxContextMenuItem, CngxMenuSeparator
 */
@Component({
  selector: 'cngx-context-menu-divider, hr[cngxContextMenuDivider]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'cngxContextMenuDivider',
  hostDirectives: [CngxMenuSeparator],
  template: '',
})
export class CngxContextMenuDivider {}
