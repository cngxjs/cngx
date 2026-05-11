import { InjectionToken, type Signal, type TemplateRef } from '@angular/core';

import type { CngxTabHandle } from './tab-group-host.token';

/**
 * Read-mostly panel-surface contract for the overflow molecule, skin
 * sub-components, and future panel-level helpers. Narrower than
 * {@link CngxTabGroupHost} — register / unregister stay on the brain.
 *
 * The single write path is `selectById`; routing back through the
 * presenter preserves clamping, disabled-skip, and commit-action
 * gating. Template resolvers let skin sub-components project the
 * `*cngxTabLabel` / `*cngxTabContent` slots without depending on the
 * concrete `CngxTabGroup` class.
 *
 * @category interactive
 */
export interface CngxTabPanelHost {
  readonly tabs: Signal<readonly CngxTabHandle[]>;
  readonly activeId: Signal<string | null>;
  readonly orientation: Signal<'horizontal' | 'vertical'>;

  selectById(id: string): void;

  /** Resolves a tab id to its `*cngxTabLabel` template (consumer-supplied). */
  labelTemplateFor(id: string): TemplateRef<unknown> | null;
  /** Resolves a tab id to its `*cngxTabContent` template (consumer-supplied). */
  contentTemplateFor(id: string): TemplateRef<unknown> | null;
}

/**
 * DI token the organism provides via `useExisting`. The overflow
 * molecule and consumer-authored skin sub-components inject this
 * instead of the concrete component class.
 *
 * @category interactive
 */
export const CNGX_TAB_PANEL_HOST = new InjectionToken<CngxTabPanelHost>(
  'CngxTabPanelHost',
);
