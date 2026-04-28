import { contentChildren, Directive, inject, input } from '@angular/core';
import { outputFromObservable, outputToObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';

import { CngxActiveDescendant } from '@cngx/common/a11y';

import { CngxMenuAnnouncer } from './menu-announcer';
import { injectMenuConfig } from './menu-config';
import { CNGX_MENU_HOST, type CngxMenuHost } from './menu-host.token';
import { CNGX_MENU_SUBMENU_ITEM, type CngxMenuSubmenuLike } from './menu-submenu.token';

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

  private readonly announcer = inject(CngxMenuAnnouncer);
  private readonly menuConfig = injectMenuConfig();

  /**
   * Submenu directives registered inside this menu's content tree. Empty
   * when the menu has no submenus. Drives the trigger's focus-stack
   * arrow-right / arrow-left semantics.
   */
  readonly submenuItems = contentChildren<CngxMenuSubmenuLike>(CNGX_MENU_SUBMENU_ITEM, {
    descendants: true,
  });

  /**
   * Emits the activated item's value on Enter/Space/click. Side effect:
   * announces `ariaLabels.itemActivated` through the polite live region.
   * The `tap` runs synchronously inside the upstream subscription —
   * announce is a fire-and-forget DOM side effect, not a signal write.
   */
  readonly itemActivated = outputFromObservable(
    outputToObservable(this.ad.activated).pipe(
      tap(() => {
        this.announcer.announce(this.menuConfig.ariaLabels.itemActivated);
      }),
      takeUntilDestroyed(),
    ),
  );
}
