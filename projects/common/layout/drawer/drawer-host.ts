import { type ElementRef, InjectionToken, type Signal } from '@angular/core';

import type { DrawerMode } from './drawer-panel.directive';
import type { DrawerPosition } from './drawer.directive';

/**
 * What a `CngxDrawerPanel` reports to its drawer host, so the host can say
 * how its panel is presented (the `CngxPanelTarget` view of `CngxDrawer`)
 * and leave Escape inside the panel to the panel's surface.
 *
 * @since 0.1.0
 */
export interface CngxDrawerPanelPresentation {
  /** The panel's `mode`. */
  readonly mode: Signal<DrawerMode>;
  /** Whether the panel's resolved modality blocks anything. */
  readonly modal: Signal<boolean>;
  /** The edge the panel slides in from. */
  readonly position: Signal<DrawerPosition>;
  /** The panel element. */
  readonly element: HTMLElement;
}

/**
 * The contract a `CngxDrawerPanel` reads from the drawer that owns its open
 * state. `CngxDrawer` implements it and provides `CNGX_DRAWER_HOST`; any
 * other state owner that implements it can drive a panel the same way,
 * bound explicitly (`[cngxDrawerPanel]="host"`) or provided on the panel's
 * own element.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/drawer/drawer-host.ts
 * @since 0.1.0
 * @relatedTo CngxDrawer, CngxDrawerPanel, CNGX_DRAWER_HOST
 */
export interface CngxDrawerHost {
  /** Whether the drawer is open. */
  readonly opened: Signal<boolean>;
  /** The `id` the panel renders unless it carries a static one. */
  readonly panelId: Signal<string | undefined>;
  /** The drawer element: the boundary of a `'contained'` panel. */
  readonly elementRef: ElementRef<HTMLElement>;
  /** Closes the drawer. The panel calls it for every dismissal request. */
  close(): void;
  /**
   * Connects a panel's presentation; the latest connected panel wins.
   * Returns the disconnect, which the panel calls when it leaves or
   * switches hosts.
   */
  connectPanel(panel: CngxDrawerPanelPresentation): () => void;
}

/**
 * The drawer host of a `CngxDrawerPanel` on the same element. `CngxDrawer`
 * provides it via `useExisting`, so a bare `cngxDrawerPanel` attribute next
 * to `cngxDrawer` resolves its drawer without injecting the concrete class.
 * An explicit `[cngxDrawerPanel]` reference wins over it.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/drawer/drawer-host.ts
 * @since 0.1.0
 * @relatedTo CngxDrawer, CngxDrawerPanel
 */
export const CNGX_DRAWER_HOST = new InjectionToken<CngxDrawerHost>('CngxDrawerHost');
