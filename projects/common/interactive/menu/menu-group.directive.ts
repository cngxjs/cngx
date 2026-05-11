import { Directive, input, model } from '@angular/core';

import { CNGX_MENU_RADIO_GROUP, type CngxMenuRadioGroup } from './menu-radio-controller';

/**
 * Logical grouping for menu items. Renders `role="group"` with an accessible
 * label. For radio groups, the host owns the selected value and exposes it
 * to enclosed `CngxMenuItemRadio` children through the
 * `CNGX_MENU_RADIO_GROUP` contract.
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxMenuGroup]',
  exportAs: 'cngxMenuGroup',
  standalone: true,
  providers: [{ provide: CNGX_MENU_RADIO_GROUP, useExisting: CngxMenuGroup }],
  host: {
    role: 'group',
    '[attr.aria-label]': 'label()',
  },
})
export class CngxMenuGroup implements CngxMenuRadioGroup<unknown> {
  /** Accessible group label. */
  readonly label = input.required<string>();

  /** Optional name for mutual-exclusion scope in radio-item groups. */
  readonly name = input<string | undefined>(undefined);

  /** Currently selected radio value within this group. Two-way bindable. */
  readonly selectedValue = model<unknown>(undefined);

  select(value: unknown): void {
    this.selectedValue.set(value);
  }
}
