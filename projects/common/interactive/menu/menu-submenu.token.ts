import { InjectionToken, type Signal } from '@angular/core';

import type { CngxMenuHost } from './menu-host.token';

/**
 * Structural contract a `CngxMenuItemSubmenu` (or any submenu-aware
 * companion) exposes so the surrounding menu trigger can drive
 * arrow-right / arrow-left keyboard semantics through a focus-stack
 * model. The trigger looks up a submenu by matching the active item's
 * `id` against this contract's `id`.
 *
 * @category common/interactive/menu
 */
export interface CngxMenuSubmenuLike {
  /** Host element id - matches the surrounding `CngxMenuItem` id. */
  readonly id: string;
  /** Reactive open state, mirrored from the wrapped popover. */
  readonly isOpen: Signal<boolean>;
  /**
   * The submenu's inner menu host (its `CngxMenu` instance), or `null` while
   * unwired. An inert companion never resolves one - the context-menu
   * organism applies the directive to every item, so leaf items register a
   * brain whose `inner` stays `null`; the focus stack treats those as inert.
   */
  readonly inner: CngxMenuHost | null;
  /**
   * Debounced pointer intent over the submenu's combined hover surface
   * (parent item plus popover panel). The companion only DERIVES this signal;
   * it never opens or closes anything off it - the surrounding trigger routes
   * intent edges through the focus stack via
   * `connectSubmenuHoverToFocusStack`, so a hover-opened submenu is
   * keyboard-visible exactly like a keyboard-opened one. Optional: a
   * companion without a pointer surface omits it and stays keyboard-only.
   */
  readonly hoverIntent?: Signal<boolean>;
  open(): void;
  close(): void;
}

/**
 * DI token a submenu-companion directive provides so composers can resolve
 * its {@link CngxMenuSubmenuLike} contract via `inject(CNGX_MENU_SUBMENU_ITEM)`
 * from within the submenu subtree.
 *
 * Note: the surrounding `CngxMenu` does NOT discover submenus through this
 * token. Discovery is DI registration via
 * {@link CngxMenuHost.registerSubmenuItem} (which crosses component view
 * boundaries a content query cannot), and the result is exposed on
 * `CngxMenuHost.submenuItems`.
 *
 * @category common/interactive/menu
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/menu/menu-submenu.token.ts
 * @since 0.1.0
 */
export const CNGX_MENU_SUBMENU_ITEM = new InjectionToken<CngxMenuSubmenuLike>(
  'CNGX_MENU_SUBMENU_ITEM',
);

/**
 * Structural popover surface the submenu brain drives. Typed structurally so
 * `@cngx/common/interactive` stays free of a `@cngx/common/popover` import
 * (menu-accepted-debt §7) - a concrete `CngxPopover` satisfies it.
 *
 * @category common/interactive/menu
 */
export interface CngxMenuSubmenuPopoverRef {
  readonly isVisible: () => boolean;
  show(): void;
  hide(): void;
  readonly anchorElement: { set(el: HTMLElement | null): void };
  /** Popover unique id signal - composes the `anchor-name` CSS value. */
  readonly id: () => string;
  /** Popover host element - submenu hover listeners attach here. */
  readonly elementRef: { readonly nativeElement: HTMLElement };
}

/**
 * Wiring a component shell provides so `CngxMenuItemSubmenu` resolves its
 * popover and inner menu from DI instead of from `[cngxMenuItemSubmenu]` /
 * `[submenuMenu]` inputs. Lets `@cngx/ui/context-menu` wire the submenu
 * brain internally (Bridge-Input-Regel) - the brain stays inert (no
 * `aria-haspopup` / `aria-expanded`) until one source is present.
 *
 * @category common/interactive/menu
 */
export interface CngxMenuSubmenuWiring {
  /** The submenu popover surface, or `undefined` while no submenu is wired. */
  popover(): CngxMenuSubmenuPopoverRef | undefined;
  /** The inner menu host, or `undefined` while no submenu is wired. */
  menu(): CngxMenuHost | undefined;
}

/**
 * DI token a component shell provides to wire `CngxMenuItemSubmenu`'s popover
 * and inner menu without template inputs. Resolution order in the brain:
 * explicit input first, then this token, else inert.
 *
 * @category common/interactive/menu
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/menu/menu-submenu.token.ts
 * @since 0.1.0
 */
export const CNGX_MENU_SUBMENU_WIRING = new InjectionToken<CngxMenuSubmenuWiring>(
  'CNGX_MENU_SUBMENU_WIRING',
);
