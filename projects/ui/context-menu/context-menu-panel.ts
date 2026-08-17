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
   * @internal Open this panel as a nested submenu of a parent item: flank the
   * inline-end (`right-start` + the submenu flip chain), open non-exclusively so
   * the parent panel survives, and mirror the parent's per-open datum. Owns the
   * submenu placement policy so a projected item drives one seam instead of
   * reaching into the popover's override signals. Optional: an ejected panel
   * skin may omit it and drive its own popover directly.
   */
  openAsSubmenu?(context: T | null): void;
  /**
   * @internal Register the trigger core's keydown handler so the panel can
   * forward ArrowRight/ArrowLeft/Escape submenu routing to it. The core owns
   * that routing, but open moves focus into the panel (a sibling of the
   * trigger), so the panel - not the trigger host - is where those keys land.
   * `null` deregisters. Optional: an ejected panel skin may omit it, in which
   * case keyboard submenu routing is simply not wired.
   */
  setKeydownHandler?(handler: ((event: KeyboardEvent) => void) | null): void;
  /**
   * @internal Register the trigger core's activation handler. The panel
   * subscribes to its menu brain's `CngxActiveDescendant.activated` output and
   * invokes this on every activation, so pointer click and Enter/Space open a
   * submenu-parent deterministically off the `activated` event rather than a
   * forwarded keydown that races the AD's own listener. `null` deregisters.
   * Optional: an ejected panel skin may omit it.
   */
  setActivationHandler?(handler: (() => void) | null): void;
  /**
   * @internal Register the trigger core's push-only "submenu opened" handler.
   * A projected item that opens its submenu through its own hover facade calls
   * {@link noteActiveSubmenuOpened} afterwards; the panel forwards to this
   * handler so the trigger's focus stack tracks the hover-opened submenu.
   * `null` deregisters. Optional: an ejected panel skin may omit it.
   */
  setSubmenuNoteHandler?(handler: (() => void) | null): void;
  /**
   * @internal Called by a projected item after it shows its submenu through its
   * own hover facade, so the trigger's focus stack records the now-open submenu
   * (ArrowLeft / Escape then pop it like a keyboard-opened one). Routes to the
   * handler registered via {@link setSubmenuNoteHandler}; a no-op when none is
   * wired.
   */
  noteActiveSubmenuOpened?(): void;
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
