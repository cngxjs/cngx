import { Directive, inject, input } from '@angular/core';
import { outputFromObservable, outputToObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CngxActiveDescendant } from '@cngx/common/a11y';

import { CNGX_MENU_HOST, type CngxMenuHost } from './menu-host.token';

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
  providers: [{ provide: CNGX_MENU_HOST, useExisting: CngxMenu }],
  host: {
    role: 'menu',
    '[attr.aria-label]': 'label()',
  },
})
export class CngxMenu implements CngxMenuHost {
  /** Accessible label. */
  readonly label = input.required<string>();

  /** Underlying `CngxActiveDescendant` — exposed for trigger composition. */
  readonly ad = inject(CngxActiveDescendant, { self: true, host: true });

  /** Emits the activated item's value on Enter/Space/click. */
  readonly itemActivated = outputFromObservable(
    outputToObservable(this.ad.activated).pipe(takeUntilDestroyed()),
  );
}
