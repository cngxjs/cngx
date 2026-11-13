import { InjectionToken, type Signal } from '@angular/core';

/**
 * How a panel is laid out against its content: `inline` reserves space in
 * the layout (a sidebar), `push` slides in next to the content, `over`
 * slides in on top of it.
 *
 * @since 0.1.0
 */
export type CngxPanelMode = 'inline' | 'push' | 'over';

/**
 * The edge a panel sits on. `start` / `end` follow the writing direction,
 * `left` / `right` / `top` / `bottom` are physical.
 *
 * @since 0.1.0
 */
export type CngxPanelSide = 'start' | 'end' | 'left' | 'right' | 'top' | 'bottom';

/**
 * The contract a disclosure panel (drawer, sidebar, sidenav) offers its
 * triggers. A trigger mirrors it and owns no state.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/panel-trigger/panel-target.ts
 * @since 0.1.0
 * @relatedTo CngxPanelTrigger, CngxPanelToggle, CNGX_PANEL_TARGET
 */
export interface CngxPanelTarget {
  /** The `id` of the panel element; the trigger's `aria-controls`. */
  readonly id: Signal<string>;
  /**
   * Whether the panel is shown (a peek included); the trigger's
   * `aria-expanded` unless `peeked`.
   */
  readonly expanded: Signal<boolean>;
  /**
   * Whether the panel shows only temporarily over its resting state.
   * Optional; unset reads as `false`. A trigger does not report a peek as
   * expanded.
   */
  readonly peeked?: Signal<boolean>;
  /** Opens a hidden panel, hides an open one. */
  toggle(): void;
  /** Shows the panel temporarily without changing its resting state. Optional. */
  peek?(): void;
  /** How the panel is laid out against its content. Optional; unset reads as `inline`. */
  readonly mode?: Signal<CngxPanelMode>;
  /**
   * Whether the shown panel blocks the page around it (a modal over-drawer).
   * Optional; unset reads as `false`.
   */
  readonly modal?: Signal<boolean>;
  /** The edge the panel sits on. Optional; unset reads as `start`. */
  readonly side?: Signal<CngxPanelSide>;
  /**
   * The panel's accessible name. A trigger without text content takes it
   * as its own name, so the name stays the same while the panel opens and
   * closes. Optional; unset or `undefined` falls back to
   * `CNGX_LAYOUT_I18N.panelTrigger`.
   */
  readonly label?: Signal<string | undefined>;
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
