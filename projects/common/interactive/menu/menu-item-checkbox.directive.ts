import { Directive, input, model } from '@angular/core';

import { CNGX_AD_ITEM, type CngxAdItemHandle } from '@cngx/common/a11y';

import { injectMenuItemCore } from './menu-item-core';

/**
 * Checkable menu item (`role="menuitemcheckbox"`). Activation toggles
 * `checked` and emits `checkedChange`. Unlike `CngxMenuItem`, the item
 * carries its own selection state.
 *
 * @category common/interactive/menu
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/menu/menu-item-checkbox.directive.ts
 * @since 0.1.0
 * @relatedTo CngxMenuItem, CngxMenuItemRadio, CngxMenu
 * <example-url>http://localhost:4200/#/common/interactive/menu/checkable/text-formatting-menu</example-url>
 */
@Directive({
  selector: '[cngxMenuItemCheckbox]',
  exportAs: 'cngxMenuItemCheckbox',
  standalone: true,
  providers: [{ provide: CNGX_AD_ITEM, useExisting: CngxMenuItemCheckbox }],
  host: {
    role: 'menuitemcheckbox',
    '[id]': 'id',
    '[attr.aria-checked]': 'checked()',
    '[attr.aria-disabled]': 'disabled() || null',
    '[class.cngx-menu-item--highlighted]': 'isHighlighted()',
    '[class.cngx-menu-item--disabled]': 'disabled()',
    '[class.cngx-menu-item--checked]': 'checked()',
    '[attr.tabindex]': '-1',
    '(click)': 'handleClick()',
    '(pointerenter)': 'handlePointerEnter()',
  },
})
export class CngxMenuItemCheckbox<T = unknown> implements CngxAdItemHandle {
  readonly value = input<T | undefined>(undefined);
  readonly disabled = input<boolean>(false);
  readonly labelInput = input<string | undefined>(undefined, { alias: 'label' });
  readonly checked = model<boolean>(false);

  private readonly core = injectMenuItemCore<T>({
    value: this.value,
    disabled: this.disabled,
    labelInput: this.labelInput,
    onActivate: () => this.checked.update((c) => !c),
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
