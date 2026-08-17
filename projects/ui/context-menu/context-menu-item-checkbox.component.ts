import {
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation,
} from '@angular/core';

import {
  CngxMenuItemCheckbox,
  CngxMenuItemIcon,
  CngxMenuItemKbd,
  CngxMenuItemLabel,
} from '@cngx/common/interactive';

/**
 * A checkable context-menu item (`role="menuitemcheckbox"`). Thin shell over
 * `CngxMenuItemCheckbox`: the brain owns the role, the active-descendant
 * registration, the toggle-on-activation semantics and the reactive
 * `aria-checked`. `checked` is a two-way model forwarded through the host
 * directive, so `[(checked)]` binds straight to consumer state.
 *
 * ```html
 * <cngx-context-menu-item-checkbox [(checked)]="wrap">Word wrap</cngx-context-menu-item-checkbox>
 * ```
 *
 * <example-url>http://localhost:4200/#/ui/context-menu/selection/checkbox-radio-items</example-url>
 * @category ui/context-menu
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/context-menu/context-menu-item-checkbox.component.ts
 * @since 0.1.0
 * @relatedTo CngxContextMenu, CngxContextMenuItem, CngxContextMenuItemRadio, CngxMenuItemCheckbox
 */
@Component({
  selector: 'cngx-context-menu-item-checkbox, button[cngxContextMenuItemCheckbox]',
  standalone: true,
  imports: [CngxMenuItemIcon, CngxMenuItemLabel, CngxMenuItemKbd],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'cngxContextMenuItemCheckbox',
  hostDirectives: [
    {
      directive: CngxMenuItemCheckbox,
      inputs: ['disabled', 'value', 'checked', 'label'],
      outputs: ['checkedChange'],
    },
  ],
  template: `
    @if (icon(); as glyph) {
      <span cngxMenuItemIcon>{{ glyph }}</span>
    }
    <span cngxMenuItemLabel><ng-content /></span>
    @if (kbd(); as shortcut) {
      <span cngxMenuItemKbd>{{ shortcut }}</span>
    }
  `,
  styleUrl: './context-menu-item.component.css',
})
export class CngxContextMenuItemCheckbox {
  /** Leading glyph rendered in the icon slot (decorative, `aria-hidden`). */
  readonly icon = input<string>();
  /** Keyboard-shortcut hint rendered in the kbd slot (decorative). */
  readonly kbd = input<string>();
}
