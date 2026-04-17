import { Directive, inject, input, output } from '@angular/core';

import { CngxActiveDescendant } from '@cngx/common/a11y';

/**
 * Navigable menu container with WAI-ARIA `role="menu"` semantics.
 *
 * Uses `CngxActiveDescendant` as a `hostDirective` so items rendered with
 * `CngxMenuItem` (or its sub-roles) are tracked automatically. No selection
 * state — menus fire actions through the `itemActivated` output.
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxMenu]',
  exportAs: 'cngxMenu',
  standalone: true,
  hostDirectives: [
    {
      directive: CngxActiveDescendant,
      inputs: ['orientation', 'loop', 'typeahead', 'autoHighlightFirst'],
    },
  ],
  host: {
    role: 'menu',
    '[attr.aria-label]': 'label()',
  },
})
export class CngxMenu {
  /** Accessible label. */
  readonly label = input.required<string>();

  /** Emits the activated item's value on Enter/Space/click. */
  readonly itemActivated = output<unknown>();

  /** Underlying `CngxActiveDescendant` — exposed for trigger composition. */
  readonly ad = inject(CngxActiveDescendant, { self: true, host: true });

  constructor() {
    this.ad.activated.subscribe((value) => this.itemActivated.emit(value));
  }
}
