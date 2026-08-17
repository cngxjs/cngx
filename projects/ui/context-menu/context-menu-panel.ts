import { InjectionToken, type Signal } from '@angular/core';

import type { CngxContextMenuTriggerPopoverRef, CngxMenuHost } from '@cngx/common/interactive';

/**
 * Structural contract a context-menu panel exposes to `CngxContextMenuFor`.
 * The trigger depends on this interface rather than the concrete
 * `CngxContextMenu` class so an ejected panel skin (decompose) or a future
 * second panel can satisfy the same seam - the `CngxMenuHost` precedent
 * (`CNGX_MENU_HOST`) applied to the panel surface.
 *
 * @category ui/context-menu
 */
export interface CngxContextMenuPanel<T = unknown> {
  /** Popover surface the trigger drives at pointer coordinates. */
  readonly popover: CngxContextMenuTriggerPopoverRef;
  /** Menu brain the popover wraps (`role="menu"`, active-descendant registry). */
  readonly menuHost: CngxMenuHost;
  /** The per-open datum while visible, `null` once closed. */
  readonly context: Signal<T | null>;
  /** Store the per-open datum. Called by the trigger before the popover opens. */
  setContext(value: T | null): void;
  /**
   * @internal Register the trigger core's keydown handler so the panel can
   * forward ArrowRight/ArrowLeft/Escape submenu routing to it. The core owns
   * that routing, but open moves focus into the panel (a sibling of the
   * trigger), so the panel - not the trigger host - is where those keys land.
   * `null` deregisters. Optional: an ejected panel skin may omit it, in which
   * case keyboard submenu routing is simply not wired.
   */
  setKeydownHandler?(handler: ((event: KeyboardEvent) => void) | null): void;
}

/**
 * @internal DI token the panel provides via `useExisting` so a projected
 * `CngxContextMenuItem` can read its enclosing panel's `context()` and mirror
 * it into a sibling-declared submenu. Not part of the public API - the child
 * talks to the panel through this structural seam rather than injecting the
 * concrete `CngxContextMenu` class (`CNGX_MENU_HOST` precedent).
 */
export const CNGX_CONTEXT_MENU_PANEL = new InjectionToken<CngxContextMenuPanel>(
  'CNGX_CONTEXT_MENU_PANEL',
);
