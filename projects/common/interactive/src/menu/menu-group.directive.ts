import { Directive, input, signal } from '@angular/core';

/**
 * Logical grouping for menu items. Renders `role="group"` with an accessible
 * label. For radio groups, its `name()` scopes mutual exclusion of
 * `CngxMenuItemRadio` children.
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxMenuGroup]',
  exportAs: 'cngxMenuGroup',
  standalone: true,
  host: {
    role: 'group',
    '[attr.aria-label]': 'label()',
  },
})
export class CngxMenuGroup {
  /** Accessible group label. */
  readonly label = input.required<string>();

  /** Optional name for mutual-exclusion scope in radio-item groups. */
  readonly name = input<string | undefined>(undefined);

  /** Currently selected radio value within this group. */
  readonly selectedValue = signal<unknown>(undefined);
}
