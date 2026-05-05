import { InjectionToken, type Signal } from '@angular/core';

import type { CngxTabHandle } from './tab-group-host.token';

/**
 * Read-mostly organism contract — what the overflow molecule, the
 * skin sub-component, and any future panel-level helper see when
 * they inject {@link CNGX_TAB_PANEL_HOST}. Deliberately narrower than
 * {@link CngxTabGroupHost}: register / unregister live on the brain,
 * not the panel surface.
 *
 * The single write method is `selectById` — the molecule's "the user
 * picked a hidden tab" path delegates back here, which lets the
 * presenter run its full `select(...)` policy (clamping, disabled
 * skip, commit-action gating).
 *
 * @category interactive
 */
export interface CngxTabPanelHost {
  readonly tabs: Signal<readonly CngxTabHandle[]>;
  readonly activeId: Signal<string | null>;
  readonly orientation: Signal<'horizontal' | 'vertical'>;

  selectById(id: string): void;
}

/**
 * DI token the Level-4 organism provides via `useExisting`. The
 * overflow molecule and any consumer-authored skin sub-component
 * inject this to read tab state + delegate selection — never the
 * concrete component class.
 *
 * @category interactive
 */
export const CNGX_TAB_PANEL_HOST = new InjectionToken<CngxTabPanelHost>(
  'CngxTabPanelHost',
);
