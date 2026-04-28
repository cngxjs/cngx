import { InjectionToken, type Signal } from '@angular/core';

import type { CngxMenuHost } from './menu-host.token';

/**
 * Structural contract a `CngxMenuItemSubmenu` (or any submenu-aware
 * companion) exposes so the surrounding menu trigger can drive
 * arrow-right / arrow-left keyboard semantics through a focus-stack
 * model. The trigger looks up a submenu by matching the active item's
 * `id` against this contract's `id`.
 *
 * @category interactive
 */
export interface CngxMenuSubmenuLike {
  /** Host element id — matches the surrounding `CngxMenuItem` id. */
  readonly id: string;
  /** Reactive open state, mirrored from the wrapped popover. */
  readonly isOpen: Signal<boolean>;
  /** The submenu's inner menu host (its `CngxMenu` instance). */
  readonly inner: CngxMenuHost;
  open(): void;
  close(): void;
}

/**
 * DI token a submenu-companion directive provides. The surrounding menu
 * collects every provider via `contentChildren(CNGX_MENU_SUBMENU_ITEM,
 * { descendants: true })` and exposes the array on `CngxMenuHost.submenuItems`.
 *
 * @category interactive
 */
export const CNGX_MENU_SUBMENU_ITEM = new InjectionToken<CngxMenuSubmenuLike>(
  'CNGX_MENU_SUBMENU_ITEM',
);
