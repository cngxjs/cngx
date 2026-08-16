import { Directive, ElementRef, inject, input, isDevMode, signal, untracked } from '@angular/core';
import {
  outputFromObservable,
  outputToObservable,
  takeUntilDestroyed,
} from '@angular/core/rxjs-interop';

import { CngxActiveDescendant } from '@cngx/common/a11y';

import { CNGX_MENU_ANNOUNCER_FACTORY } from './menu-announcer';
import { injectMenuConfig } from './menu-config';
import { CNGX_MENU_HOST, type CngxMenuHost } from './menu-host.token';
import type { CngxMenuSubmenuLike } from './menu-submenu.token';

/** Shallow identity/length equality for the submenu registry signal. */
function sameSubmenuItems(
  a: readonly CngxMenuSubmenuLike[],
  b: readonly CngxMenuSubmenuLike[],
): boolean {
  return a.length === b.length && a.every((item, i) => item === b[i]);
}

const warnedFocusHosts = new WeakSet<HTMLElement>();

/**
 * Navigable menu container with WAI-ARIA `role="menu"` semantics.
 *
 * Uses `CngxActiveDescendant` as a `hostDirective` so items rendered with
 * `CngxMenuItem` (or its sub-roles) are tracked automatically. No selection
 * state - menus fire actions through the `itemActivated` output.
 *
 * @category common/interactive/menu
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/menu/menu.directive.ts
 * @since 0.1.0
 * @relatedTo CngxMenuTrigger, CngxMenuItem, CngxMenuGroup, CngxContextMenuTrigger, CngxActiveDescendant
 * <example-url>http://localhost:4200/#/common/interactive/context-menu/right-click-target-zone</example-url>
 * <example-url>http://localhost:4200/#/common/interactive/menu/submenu/two-level-submenu</example-url>
 * <example-url>http://localhost:4200/#/common/interactive/menu/trigger/dropdown-menu</example-url>
 * <example-url>http://localhost:4200/#/common/interactive/menu/base/action-menu-with-separator</example-url>
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
    tabindex: '0',
    '[attr.aria-label]': 'label()',
  },
})
export class CngxMenu implements CngxMenuHost {
  /** Accessible label. */
  readonly label = input.required<string>();

  /** Underlying `CngxActiveDescendant` - exposed for trigger composition. */
  readonly ad = inject(CngxActiveDescendant, { self: true, host: true });

  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly announcer = inject(CNGX_MENU_ANNOUNCER_FACTORY)();
  private readonly menuConfig = injectMenuConfig();

  /** Internal registry backing {@link submenuItems}. */
  private readonly _submenuItems = signal<readonly CngxMenuSubmenuLike[]>([], {
    equal: sameSubmenuItems,
  });

  /**
   * Submenu directives registered against this menu via DI. Empty when the
   * menu has no submenus. Drives the trigger's focus-stack arrow-right /
   * arrow-left semantics. Registration (not a content query) so a
   * `[cngxMenuItemSubmenu]` declared inside a wrapper component's template
   * is still discovered - see {@link registerSubmenuItem}.
   */
  readonly submenuItems = this._submenuItems.asReadonly();

  /**
   * Register a submenu companion (a {@link CngxMenuSubmenuLike}) and return
   * its deregister callback. Called from `CngxMenuItemSubmenu`'s constructor;
   * the companion invokes the returned callback on destroy.
   */
  registerSubmenuItem(item: CngxMenuSubmenuLike): () => void {
    this._submenuItems.update((items) => [...items, item]);
    return () => {
      this._submenuItems.update((items) => items.filter((i) => i !== item));
    };
  }

  /** Emits the activated item's value on Enter/Space/click. */
  readonly itemActivated = outputFromObservable(
    outputToObservable(this.ad.activated).pipe(takeUntilDestroyed()),
  );

  constructor() {
    outputToObservable(this.ad.activated)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        untracked(() => {
          this.announcer.announce(this.menuConfig.ariaLabels.itemActivated);
        });
      });
  }

  /**
   * Move DOM focus to the menu container so its host
   * `CngxActiveDescendant` receives keyboard input. Consumers (notably
   * `CngxContextMenuTrigger`) call this after open to transfer focus
   * from the trigger zone into the menu. The host element MUST carry a
   * non-negative `tabindex` for focus to land - the menu's stories use
   * `tabindex="0"` and consumers should mirror that.
   *
   * `preventScroll: true` keeps the popover anchored when focusing into
   * a menu that lives outside the visual viewport edge.
   */
  focus(): void {
    const el = this.elementRef.nativeElement;
    if (isDevMode() && el.tabIndex < 0 && !warnedFocusHosts.has(el)) {
      warnedFocusHosts.add(el);
      console.warn(
        'CngxMenu.focus(): host element has tabindex < 0; focus() will silently no-op. ' +
          'Add tabindex="0" to the cngxMenu host so the menu container receives keyboard focus.',
      );
    }
    el.focus({ preventScroll: true });
  }
}
