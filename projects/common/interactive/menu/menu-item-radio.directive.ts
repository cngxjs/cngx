import { computed, Directive, inject, input } from '@angular/core';

import { CNGX_AD_ITEM, type CngxAdItemHandle } from '@cngx/common/a11y';

import { injectMenuItemCore } from './menu-item-core';
import { CNGX_MENU_RADIO_GROUP } from './menu-radio-controller';

/**
 * Radio-style menu item (`role="menuitemradio"`). Mutual exclusion is scoped
 * to the enclosing `CngxMenuGroup` - only one radio per group is checked at
 * a time.
 *
 * @category common/interactive/menu
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/menu/menu-item-radio.directive.ts
 * @since 0.1.0
 * @relatedTo CngxMenuItem, CngxMenuItemCheckbox, CngxMenuGroup
 * <example-url>http://localhost:4200/#/common/interactive/menu/checkable/text-formatting-menu</example-url>
 */
@Directive({
  selector: '[cngxMenuItemRadio]',
  exportAs: 'cngxMenuItemRadio',
  standalone: true,
  providers: [{ provide: CNGX_AD_ITEM, useExisting: CngxMenuItemRadio }],
  host: {
    role: 'menuitemradio',
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
export class CngxMenuItemRadio<T = unknown> implements CngxAdItemHandle {
  readonly value = input.required<T>();
  readonly disabled = input<boolean>(false);
  readonly labelInput = input<string | undefined>(undefined, { alias: 'label' });

  private readonly group = inject(CNGX_MENU_RADIO_GROUP, { optional: true });

  private readonly core = injectMenuItemCore<T>({
    value: this.value,
    disabled: this.disabled,
    labelInput: this.labelInput,
    onActivate: () => this.group?.select(this.value()),
  });

  readonly id = this.core.id;

  readonly isHighlighted = this.core.isHighlighted;

  /** Whether this radio is the currently selected value in its group. */
  readonly checked = computed<boolean>(() => {
    const group = this.group;
    if (!group) {
      return false;
    }
    return Object.is(group.selectedValue(), this.value());
  });

  readonly label = (): string => this.core.label();

  protected handleClick(): void {
    this.core.handleClick();
  }

  protected handlePointerEnter(): void {
    this.core.handlePointerEnter();
  }
}
