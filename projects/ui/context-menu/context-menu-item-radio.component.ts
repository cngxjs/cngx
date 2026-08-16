import {
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation,
} from '@angular/core';

import {
  CngxMenuItemIcon,
  CngxMenuItemKbd,
  CngxMenuItemLabel,
  CngxMenuItemRadio,
} from '@cngx/common/interactive';

/**
 * A radio-style context-menu item (`role="menuitemradio"`). Thin shell over
 * `CngxMenuItemRadio`: the brain owns the role, the active-descendant
 * registration and the reactive `aria-checked`. Mutual exclusion is scoped to
 * the enclosing `[cngxMenuGroup]` - the group owns the selected value, the
 * item forwards its `value`.
 *
 * ```html
 * <div cngxMenuGroup label="Density" [(selectedValue)]="density">
 *   <cngx-context-menu-item-radio value="cozy">Cozy</cngx-context-menu-item-radio>
 *   <cngx-context-menu-item-radio value="compact">Compact</cngx-context-menu-item-radio>
 * </div>
 * ```
 *
 * @category ui/context-menu
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/context-menu/context-menu-item-radio.component.ts
 * @since 0.1.0
 * @relatedTo CngxContextMenu, CngxContextMenuItem, CngxContextMenuItemCheckbox, CngxMenuItemRadio, CngxMenuGroup
 */
@Component({
  selector: 'cngx-context-menu-item-radio, button[cngxContextMenuItemRadio]',
  standalone: true,
  imports: [CngxMenuItemIcon, CngxMenuItemLabel, CngxMenuItemKbd],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'cngxContextMenuItemRadio',
  hostDirectives: [{ directive: CngxMenuItemRadio, inputs: ['disabled', 'value', 'label'] }],
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
export class CngxContextMenuItemRadio {
  /** Leading glyph rendered in the icon slot (decorative, `aria-hidden`). */
  readonly icon = input<string>();
  /** Keyboard-shortcut hint rendered in the kbd slot (decorative). */
  readonly kbd = input<string>();
}
