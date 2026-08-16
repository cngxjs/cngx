import type { Signal } from '@angular/core';

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
}
