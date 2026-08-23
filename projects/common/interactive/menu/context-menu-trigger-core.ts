import { type Signal } from '@angular/core';
import { resolveInlineArrowKey, type CngxDirection } from '@cngx/core';

import {
  createMenuTriggerDismissBinding,
  type CngxMenuDismissHandlerFactory,
  type CngxMenuDismissPopoverRef,
  type CngxMenuDismissSource,
} from './dismiss-handler';
import type { CngxMenuAnnouncerLike } from './menu-announcer';
import type { CngxMenuConfig } from './menu-config';
import type { CngxMenuFocusStackFactory } from './menu-focus-stack';
import type { CngxMenuHost } from './menu-host.token';
import type { CngxMenuNavStrategy } from './menu-nav-strategy';

/**
 * Popover surface the context-menu core drives at pointer coordinates.
 * Typed structurally to keep `@cngx/common/interactive` free of a
 * `@cngx/common/popover` import (menu-accepted-debt §7).
 *
 * @category common/interactive/menu
 */
export interface CngxContextMenuTriggerPopoverRef extends CngxMenuDismissPopoverRef {
  show(): void;
  readonly anchorElement: { set(el: HTMLElement | null): void };
  /**
   * Popover unique id signal - used to compose the `anchor-name` CSS value
   * the browser's CSS Anchor Positioning expects on the anchor element.
   */
  readonly id: () => string;
}

/**
 * Decision returned by the {@link CngxContextMenuTriggerCoreDeps.resolveOpen}
 * seam. `open: false` leaves the native context menu untouched; `open: true`
 * carries the per-open context handed to `commitContext`.
 *
 * @category common/interactive/menu
 */
export type CngxContextMenuOpenDecision =
  | { readonly open: false }
  | { readonly open: true; readonly context: unknown };

/**
 * Dependencies for {@link createContextMenuTriggerCore}. The caller injects
 * the DI-backed collaborators (dismiss factory, announcer, config) and
 * passes them in, keeping the core a pure factory.
 *
 * @category common/interactive/menu
 */
export interface CngxContextMenuTriggerCoreDeps {
  /** Menu the popover wraps. */
  readonly menu: () => CngxMenuHost;
  /** Popover panel opened at pointer coordinates. */
  readonly popover: () => CngxContextMenuTriggerPopoverRef;
  /** Trigger host element - anchor for Shift+F10 and the dismiss filter. */
  readonly hostElement: HTMLElement;
  /** Document used for the transient anchor and focus capture. */
  readonly document: Document;
  /** Menu config supplying dismissal aria-labels. */
  readonly menuConfig: CngxMenuConfig;
  /** Dismiss-handler factory (from `CNGX_MENU_DISMISS_HANDLER_FACTORY`). */
  readonly dismissFactory: CngxMenuDismissHandlerFactory;
  /** Announcer for AT dismissal messages. */
  readonly announcer: CngxMenuAnnouncerLike;
  /** Keyboard policy for ArrowRight/ArrowLeft submenu routing. */
  readonly nav: CngxMenuNavStrategy;
  /**
   * Document writing direction. Resolves the physical arrow to its
   * inline-logical intent at the dispatch site, so under `rtl` physical
   * ArrowLeft opens the submenu and physical ArrowRight pops it.
   */
  readonly direction: Signal<CngxDirection>;
  /** Focus-stack factory (from `CNGX_MENU_FOCUS_STACK_FACTORY`). */
  readonly focusStackFactory: CngxMenuFocusStackFactory;
  /**
   * Veto/datum seam. Evaluated as the FIRST thing in the `contextmenu`
   * handler, BEFORE `preventDefault()`. `{ open: false }` leaves the native
   * menu untouched (no `preventDefault`, no anchor, no open).
   * `{ open: true, context }` prevents default, hands `context` to
   * {@link commitContext}, then opens. Defaults to always-open with
   * `undefined` context, so a consumer that omits it keeps the plain
   * right-click-always-opens behaviour.
   */
  readonly resolveOpen?: (event: MouseEvent) => CngxContextMenuOpenDecision;
  /** Receives the resolved context on a successful open. No-op by default. */
  readonly commitContext?: (context: unknown) => void;
}

/**
 * Shared context-menu trigger core. Owns the `contextmenu` / `Shift+F10`
 * handling, the transient pointer-anchor lifecycle, the dismiss binding,
 * announcer calls, and focus save/restore. Consumed by both
 * `CngxContextMenuTrigger` (directive) and `CngxContextMenuFor` (organism
 * trigger) so the two share one implementation without inheritance.
 *
 * @category common/interactive/menu
 */
export interface CngxContextMenuTriggerCore {
  /** The dismissal source that closed the menu most recently. */
  readonly lastDismissSource: Signal<CngxMenuDismissSource | null>;
  /** `contextmenu` host handler - consults `resolveOpen` before opening. */
  handleContextMenu(event: MouseEvent): void;
  /** Keydown host handler - `Shift+F10` opens at the host centre. */
  handleKeydown(event: KeyboardEvent): void;
  /**
   * Open the submenu of the effective menu's active item through the focus
   * stack. No-op when the active item is a leaf (or nothing is active) and
   * idempotent when that submenu is already open. The DI host wires the
   * surrounding menu's `CngxActiveDescendant.activated` output to this method
   * so pointer click and Enter/Space open a submenu parent deterministically,
   * off the `activated` event rather than a forwarded keydown that races the
   * AD's own listener. No `activated` subscription lives inside this pure
   * factory - only the imperative open.
   */
  openActiveSubmenu(): void;
  /**
   * Record that the active item's submenu is already open (shown by the
   * organism's hover facade), pushing it onto the focus stack WITHOUT
   * re-opening it, so ArrowLeft / Escape pop a hover-opened submenu the same as
   * a keyboard-opened one. No-op on a leaf and idempotent once the submenu is
   * on the stack. The DI host calls this from the item's hover terminal.
   */
  noteActiveSubmenuOpened(): void;
  /** Drive from the directive's `isOpen` effect (inside `untracked`). */
  syncOpenState(open: boolean): void;
  /** Teardown - call from the directive's `DestroyRef.onDestroy`. */
  destroy(): void;
}

const DEFAULT_RESOLVE_OPEN = (): CngxContextMenuOpenDecision => ({
  open: true,
  context: undefined,
});

/**
 * Build a {@link CngxContextMenuTriggerCore} from its dependencies. Pure
 * factory - no Angular DI; the caller resolves collaborators and passes
 * them in.
 *
 * @category common/interactive/menu
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/menu/context-menu-trigger-core.ts
 * @since 0.1.0
 */
export function createContextMenuTriggerCore(
  deps: CngxContextMenuTriggerCoreDeps,
): CngxContextMenuTriggerCore {
  const resolveOpen = deps.resolveOpen ?? DEFAULT_RESOLVE_OPEN;

  // Shared submenu focus-stack model - identical W3C APG keyboard contract to
  // CngxMenuTrigger. The core owns the ArrowRight/ArrowLeft/Escape routing;
  // whoever forwards keydown into `handleKeydown` (the trigger host, and the
  // organism panel in @cngx/ui/context-menu) drives it.
  const focusStack = deps.focusStackFactory({
    rootMenu: () => deps.menu(),
    popover: () => deps.popover(),
    nav: deps.nav,
    document: deps.document,
  });

  const dismissBinding = createMenuTriggerDismissBinding({
    popover: () => deps.popover(),
    hostElement: deps.hostElement,
    menuConfig: deps.menuConfig,
    factory: deps.dismissFactory,
    onDismiss: () => deps.announcer.announce(deps.menuConfig.ariaLabels.menuDismissed),
  });

  let virtualAnchor: HTMLElement | null = null;

  const ensureVirtualAnchor = (): HTMLElement => {
    if (virtualAnchor) {
      return virtualAnchor;
    }
    const el = deps.document.createElement('div');
    el.setAttribute('aria-hidden', 'true');
    el.className = 'cngx-context-menu-anchor';
    el.style.cssText = 'position:fixed;width:0;height:0;pointer-events:none';
    deps.document.body.appendChild(el);
    virtualAnchor = el;
    return el;
  };

  const removeVirtualAnchor = (): void => {
    virtualAnchor?.remove();
    virtualAnchor = null;
  };

  const openAt = (x: number, y: number): void => {
    // Capture the pre-open focus eagerly BEFORE show(): the effect-driven
    // capture races the queueMicrotask focus transfer below in real browsers
    // and ends up storing the menu UL instead of the pre-open target. The
    // effect still runs (it also attaches the dismiss binding) but the focus
    // stack's own `savedFocus === null` guard keeps this earlier capture.
    focusStack.captureFocus();
    const anchor = ensureVirtualAnchor();
    anchor.style.left = `${x}px`;
    anchor.style.top = `${y}px`;
    anchor.style.setProperty('anchor-name', `--cngx-pop-${deps.popover().id()}`);
    deps.popover().anchorElement.set(anchor);
    if (!deps.popover().isVisible()) {
      deps.popover().show();
    }
    // Attach the dismiss listeners eagerly here, not only from the `isOpen`
    // effect: `showPopover()` makes the menu visible synchronously, but the
    // effect runs a change-detection flush later, leaving a
    // visible-but-not-listening window in which an immediate scroll / blur /
    // outside-pointerdown would fail to dismiss. `attach()` is idempotent, so
    // the effect's later call is a no-op.
    dismissBinding.attach();
    deps.menu().ad.highlightFirst();
    // Defer one microtask so showPopover()'s top-layer DOM mutation settles
    // before focus moves into the menu container - matches the close-time
    // `restoreFocus` pattern.
    queueMicrotask(() => deps.menu().focus());
  };

  return {
    lastDismissSource: dismissBinding.lastSource,
    handleContextMenu(event: MouseEvent): void {
      const decision = resolveOpen(event);
      if (!decision.open) {
        return;
      }
      event.preventDefault();
      deps.commitContext?.(decision.context);
      openAt(event.clientX, event.clientY);
    },
    handleKeydown(event: KeyboardEvent): void {
      if (event.key === 'F10' && event.shiftKey) {
        event.preventDefault();
        const rect = deps.hostElement.getBoundingClientRect();
        openAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
        return;
      }
      // Submenu keyboard routing while the menu is open. Down/Up/Home/End/Enter
      // are owned by the menu container's CngxActiveDescendant; the focus stack
      // adds ArrowRight/ArrowLeft (open/close a submenu) and innermost-first
      // Escape. Root-level Escape stays owned by CngxPopover's global listener,
      // so it is only routed here once a submenu is on the stack.
      if (!deps.popover().isVisible()) {
        return;
      }
      const menu = focusStack.effectiveMenu();
      switch (resolveInlineArrowKey(event.key, deps.direction())) {
        case 'ArrowRight':
          focusStack.handleArrowRight(menu, event);
          return;
        case 'ArrowLeft':
          focusStack.handleArrowLeft(menu, event);
          return;
        case 'Escape':
          if (focusStack.stack().length > 0) {
            focusStack.handleEscape(event);
          }
          return;
      }
    },
    openActiveSubmenu(): void {
      const submenu = focusStack.activeSubmenu();
      if (submenu) {
        focusStack.openSubmenuFor(submenu);
      }
    },
    noteActiveSubmenuOpened(): void {
      const submenu = focusStack.activeSubmenu();
      if (submenu) {
        focusStack.noteSubmenuOpened(submenu);
      }
    },
    syncOpenState(open: boolean): void {
      if (open) {
        focusStack.captureFocus();
        dismissBinding.attach();
      } else {
        dismissBinding.detach();
        // Clear any open submenu chain: a non-Escape dismissal (outside-click,
        // blur, scroll) hides the root popover without touching the stack, so
        // without this a reopened menu's effectiveMenu() would be a submenu
        // that no longer exists and Arrow/Home/Enter would route into thin air.
        focusStack.reset();
        focusStack.restoreFocus();
      }
    },
    destroy(): void {
      removeVirtualAnchor();
      dismissBinding.detach();
    },
  };
}
