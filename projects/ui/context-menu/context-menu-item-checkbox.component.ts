import {
  ChangeDetectionStrategy,
  Component,
  contentChild,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { CngxIconSvg } from '@cngx/common/display';
import {
  CNGX_MENU_ITEM_OWN_INDICATOR,
  CngxMenuItemCheckbox,
  CngxMenuItemIcon,
  CngxMenuItemKbd,
  CngxMenuItemLabel,
} from '@cngx/common/interactive';
import { CNGX_ICON_CHECK } from '@cngx/utils';

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
 * <example-url>/#/ui/context-menu/selection/checkbox-radio-items</example-url>
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/context-menu/context-menu-item-checkbox.component.ts
 * @since 0.1.0
 * @relatedTo CngxContextMenu, CngxContextMenuItem, CngxContextMenuItemRadio, CngxMenuItemCheckbox
 */
@Component({
  selector: 'cngx-context-menu-item-checkbox, button[cngxContextMenuItemCheckbox]',
  standalone: true,
  imports: [CngxIconSvg, CngxMenuItemIcon, CngxMenuItemLabel, CngxMenuItemKbd],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'cngxContextMenuItemCheckbox',
  providers: [{ provide: CNGX_MENU_ITEM_OWN_INDICATOR, useValue: true }],
  hostDirectives: [
    {
      directive: CngxMenuItemCheckbox,
      inputs: ['disabled', 'value', 'checked', 'label'],
      outputs: ['checkedChange'],
    },
  ],
  template: `
    <span class="cngx-menu-item__check" aria-hidden="true">
      @if (brain.checked()) {
        <svg [cngxIconSvg]="checkIcon"></svg>
      }
    </span>
    <ng-content select="[cngxMenuItemIcon]" />
    @if (!projectedIcon() && icon(); as glyph) {
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
  /**
   * Leading glyph shorthand rendered in the icon slot (decorative,
   * `aria-hidden`). Suppressed when the consumer projects a richer
   * `[cngxMenuItemIcon]` marker. The checked-indicator gutter renders
   * independently of the icon, so a checked item stays visibly checked beside
   * a custom icon.
   */
  readonly icon = input<string>();
  /** Keyboard-shortcut hint rendered in the kbd slot (decorative). */
  readonly kbd = input<string>();

  /**
   * A consumer-projected `[cngxMenuItemIcon]` marker, when present. Gates the
   * string `[icon]` shorthand off so the projected icon is the only one drawn.
   */
  protected readonly projectedIcon = contentChild(CngxMenuItemIcon);

  /** @internal The brain host directive; its `checked()` gates the indicator. */
  protected readonly brain = inject(CngxMenuItemCheckbox, { host: true });

  /** @internal Leading checked indicator, drawn in an always-present gutter so
   * the label does not shift when the item is checked or unchecked. */
  protected readonly checkIcon = CNGX_ICON_CHECK;
}
