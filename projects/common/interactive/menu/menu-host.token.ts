import { InjectionToken, type Signal } from '@angular/core';

import type { CngxActiveDescendant } from '@cngx/common/a11y';

import type { CngxMenuSubmenuLike } from './menu-submenu.token';

/**
 * Structural contract a `CngxMenu` (or a future menu-bar / nested menu
 * host) exposes to composers. Triggers and submenu directives depend on
 * this interface rather than on the concrete `CngxMenu` class so the
 * coupling stays substitutable.
 */
export interface CngxMenuHost {
  readonly ad: CngxActiveDescendant;
  /**
   * Submenu companions registered inside this menu's content tree.
   * Empty when no submenu directive is present. Recursive: each entry's
   * `inner` is itself a `CngxMenuHost` with its own (possibly empty)
   * `submenuItems`.
   */
  readonly submenuItems: Signal<readonly CngxMenuSubmenuLike[]>;
}

/**
 * DI token a menu host provides for sub-component composers (e.g. an
 * inside-the-menu submenu trigger) that resolve the host via `inject()`.
 * Triggers that live on a different element pass a template-ref through
 * an input typed against `CngxMenuHost` instead — DI across element
 * boundaries cannot reach the menu.
 */
export const CNGX_MENU_HOST = new InjectionToken<CngxMenuHost>('CNGX_MENU_HOST');
