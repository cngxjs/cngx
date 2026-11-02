import { computed, Directive, inject, input } from '@angular/core';

import { CNGX_AD_ITEM, type CngxAdItemHandle } from '@cngx/common/a11y';
import { CNGX_ICON_DOT, CngxRuntimeError } from '@cngx/utils';

import { injectMenuItemCore } from './menu-item-core';
import { injectMenuItemIndicator } from './menu-item-indicator';
import { CNGX_MENU_RADIO_GROUP, type CngxMenuRadioGroup } from './menu-radio-controller';

/**
 * Radio-style menu item (`role="menuitemradio"`). Mutual exclusion is scoped
 * to the enclosing `CngxMenuGroup` - only one radio per group is checked at
 * a time.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/menu/menu-item-radio.directive.ts
 * @since 0.1.0
 * @relatedTo CngxMenuItem, CngxMenuItemCheckbox, CngxMenuGroup
 * <example-url>/#/common/interactive/menu/checkable/text-formatting-menu</example-url>
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
  /**
   * Required value this radio represents. The item is checked while the enclosing
   * `CngxMenuGroup` `selectedValue` is identical (`Object.is`) to it, and activation selects it.
   */
  readonly value = input.required<T>();
  /**
   * Disables the item. A click then announces the menu's `itemDisabled` phrase and does not
   * change the group selection, pointer enter no longer highlights, and the host gets
   * `aria-disabled` and the `cngx-menu-item--disabled` class. Defaults to `false`.
   */
  readonly disabled = input<boolean>(false);
  /**
   * Binds as `[label]`. Explicit label that `label()` returns for the active-descendant;
   * when unset, `label()` falls back to the host's trimmed text content.
   */
  readonly labelInput = input<string | undefined>(undefined, { alias: 'label' });

  private readonly group = injectMenuRadioGroup();

  private readonly core = injectMenuItemCore<T>({
    value: this.value,
    disabled: this.disabled,
    labelInput: this.labelInput,
    onActivate: () => this.group.select(this.value()),
  });

  readonly id = this.core.id;

  readonly isHighlighted = this.core.isHighlighted;

  /** Whether this radio is the currently selected value in its group. */
  readonly checked = computed<boolean>(() => Object.is(this.group.selectedValue(), this.value()));

  readonly label = (): string => this.core.label();

  constructor() {
    injectMenuItemIndicator(this.checked, CNGX_ICON_DOT);
  }

  protected handleClick(): void {
    this.core.handleClick();
  }

  protected handlePointerEnter(): void {
    this.core.handlePointerEnter();
  }
}

function injectMenuRadioGroup(): CngxMenuRadioGroup<unknown> {
  const group = inject(CNGX_MENU_RADIO_GROUP, { optional: true });
  if (!group) {
    throw new CngxRuntimeError(
      'CNGX1057',
      typeof ngDevMode !== 'undefined' &&
        ngDevMode &&
        '[cngxMenuItemRadio] must be placed inside an element with [cngxMenuGroup].',
    );
  }
  return group;
}
