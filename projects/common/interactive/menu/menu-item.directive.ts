import { Directive, input } from '@angular/core';

import { CNGX_AD_ITEM, type CngxAdItemHandle } from '@cngx/common/a11y';

import { injectMenuItemCore } from './menu-item-core';

/**
 * A single action menuitem registered with a surrounding `CngxActiveDescendant`.
 * Unlike `CngxOption`, menu items carry no selection state - activation fires
 * the AD's `activated` output and the consumer dispatches the action.
 *
 * Click activates (honouring the disabled state). `pointerenter` highlights
 * without activating, matching native menu behaviour.
 *
 * @category common/interactive/menu
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/menu/menu-item.directive.ts
 * @since 0.1.0
 * @relatedTo CngxMenu, CngxMenuItemCheckbox, CngxMenuItemRadio, CngxMenuItemSubmenu
 * <example-url>http://localhost:4200/#/common/interactive/context-menu/right-click-target-zone</example-url>
 * <example-url>http://localhost:4200/#/common/interactive/menu/submenu/two-level-submenu</example-url>
 * <example-url>http://localhost:4200/#/common/interactive/menu/trigger/dropdown-menu</example-url>
 * <example-url>http://localhost:4200/#/common/interactive/menu/base/action-menu-with-separator</example-url>
 */
@Directive({
  selector: '[cngxMenuItem]',
  exportAs: 'cngxMenuItem',
  standalone: true,
  providers: [{ provide: CNGX_AD_ITEM, useExisting: CngxMenuItem }],
  host: {
    role: 'menuitem',
    '[id]': 'id',
    '[class.cngx-menu-item--highlighted]': 'isHighlighted()',
    '[class.cngx-menu-item--disabled]': 'disabled()',
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.tabindex]': '-1',
    '(click)': 'handleClick()',
    '(pointerenter)': 'handlePointerEnter()',
  },
})
export class CngxMenuItem<T = unknown> implements CngxAdItemHandle {
  readonly value = input<T | undefined>(undefined);
  readonly disabled = input<boolean>(false);
  readonly labelInput = input<string | undefined>(undefined, { alias: 'label' });

  private readonly core = injectMenuItemCore<T>({
    value: this.value,
    disabled: this.disabled,
    labelInput: this.labelInput,
  });

  readonly id = this.core.id;

  readonly isHighlighted = this.core.isHighlighted;

  readonly label = (): string => this.core.label();

  protected handleClick(): void {
    this.core.handleClick();
  }

  protected handlePointerEnter(): void {
    this.core.handlePointerEnter();
  }
}
