import { InjectionToken } from '@angular/core';

import type { CngxActiveDescendant } from '@cngx/common/a11y';

/**
 * Structural contract a `CngxMenu` (or a future menu-bar / submenu host)
 * exposes to composers — currently the underlying `CngxActiveDescendant`
 * driving keyboard navigation. Triggers and submenu directives should depend
 * on this interface rather than on the concrete `CngxMenu` class so the
 * coupling stays substitutable.
 */
export interface CngxMenuHost {
  readonly ad: CngxActiveDescendant;
}

/**
 * DI token a menu host provides for sub-component composers (e.g. an
 * inside-the-menu submenu trigger) that resolve the host via `inject()`.
 * Triggers that live on a different element pass a template-ref through
 * an input typed against `CngxMenuHost` instead — DI across element
 * boundaries cannot reach the menu.
 */
export const CNGX_MENU_HOST = new InjectionToken<CngxMenuHost>('CNGX_MENU_HOST');
