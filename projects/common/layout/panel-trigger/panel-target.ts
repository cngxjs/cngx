import { InjectionToken, type Signal } from '@angular/core';

/**
 * The contract a disclosure panel (drawer, sidebar, sidenav) offers its
 * triggers. A trigger mirrors it and owns no state.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/panel-trigger/panel-target.ts
 * @since 0.1.0
 * @relatedTo CngxPanelTrigger, CNGX_PANEL_TARGET
 */
export interface CngxPanelTarget {
  /** The `id` of the panel element; the trigger's `aria-controls`. */
  readonly id: Signal<string>;
  /** Whether the panel is shown; the trigger's `aria-expanded`. */
  readonly expanded: Signal<boolean>;
  /** Opens a hidden panel, hides an open one. */
  toggle(): void;
  /** Shows the panel temporarily without changing its resting state. Optional. */
  peek?(): void;
}

/**
 * The panel target of the surrounding drawer, sidebar or sidenav, for a
 * `CngxPanelTrigger` placed inside it (a pin or close button). A trigger
 * outside the panel takes the target as an explicit reference instead.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/panel-trigger/panel-target.ts
 * @since 0.1.0
 * @relatedTo CngxPanelTrigger, CngxDrawer
 */
export const CNGX_PANEL_TARGET = new InjectionToken<CngxPanelTarget>('CngxPanelTarget');
