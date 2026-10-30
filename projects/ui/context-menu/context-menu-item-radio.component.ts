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
  CngxMenuItemIcon,
  CngxMenuItemKbd,
  CngxMenuItemLabel,
  CngxMenuItemRadio,
} from '@cngx/common/interactive';
import { CNGX_ICON_DOT } from '@cngx/utils';

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
 * <example-url>http://localhost:4200/#/ui/context-menu/selection/checkbox-radio-items</example-url>
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/context-menu/context-menu-item-radio.component.ts
 * @since 0.1.0
 * @relatedTo CngxContextMenu, CngxContextMenuItem, CngxContextMenuItemCheckbox, CngxMenuItemRadio, CngxMenuGroup
 */
@Component({
  selector: 'cngx-context-menu-item-radio, button[cngxContextMenuItemRadio]',
  standalone: true,
  imports: [CngxIconSvg, CngxMenuItemIcon, CngxMenuItemLabel, CngxMenuItemKbd],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'cngxContextMenuItemRadio',
  providers: [{ provide: CNGX_MENU_ITEM_OWN_INDICATOR, useValue: true }],
  hostDirectives: [{ directive: CngxMenuItemRadio, inputs: ['disabled', 'value', 'label'] }],
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
export class CngxContextMenuItemRadio {
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
  protected readonly brain = inject(CngxMenuItemRadio, { host: true });

  /** @internal Leading checked indicator, drawn in an always-present gutter so
   * the label does not shift when the item is checked or unchecked. */
  protected readonly checkIcon = CNGX_ICON_DOT;
}
