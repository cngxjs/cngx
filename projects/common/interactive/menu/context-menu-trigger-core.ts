import { type Signal } from '@angular/core';
import { type CngxDirection } from '@cngx/core';
import { coerceSignal } from '@cngx/core/utils';

import {
  type CngxMenuDismissHandlerFactory,
  type CngxMenuDismissPopoverRef,
  type CngxMenuDismissSource,
} from './dismiss-handler';
import type { CngxMenuAnnouncerLike } from './menu-announcer';
import type { CngxMenuConfig } from './menu-config';
import type { CngxMenuFocusStack, CngxMenuFocusStackFactory } from './menu-focus-stack';
import type { CngxMenuHost } from './menu-host.token';
import type { CngxMenuNavStrategy } from './menu-nav-strategy';
import { createMenuTriggerLifecycle, isMenuShortcutCombo } from './menu-trigger-lifecycle';

/**
 * Popover surface the context-menu core drives at pointer coordinates.
 * Typed structurally to keep `@cngx/common/interactive` free of a
 * `@cngx/common/popover` import (menu-accepted-debt §7).
 */
export interface CngxContextMenuTriggerPopoverRef extends CngxMenuDismissPopoverRef {
  show(): void;
  /** Register the virtual pointer-coordinate anchor, or clear it. */
  setAnchorElement(el: HTMLElement | null): void;
  /**
   * Popover unique id signal - used to compose the `anchor-name` CSS value
   * the browser's CSS Anchor Positioning expects on the anchor element.
   */
  readonly id: () => string;
  /**
   * Owner-keyed `position-try-fallbacks` hint. The core claims
   * `CngxMenuConfig.tryFallbacks` before each open, so a context menu near
   * the viewport edge flips like a `CngxMenuTrigger` menu; a bound
   * `[positionTryFallbacks]` or an override still wins.
   */
  claimPositionTryFallbacks(owner: object, value: readonly string[]): void;
  releasePositionTryFallbacks(owner: object): void;
}

/**
 * Decision returned by the {@link CngxContextMenuTriggerCoreDeps.resolveOpen}
 * seam. `open: false` leaves the native context menu untouched; `open: true`
 * carries the per-open context handed to `commitContext`.
 */
export type CngxContextMenuOpenDecision =
  | { readonly open: false }
  | { readonly open: true; readonly context: unknown };

/**
 * Dependencies for {@link createContextMenuTriggerCore}. The caller injects
 * the DI-backed collaborators (dismiss factory, announcer, config) and
 * passes them in, keeping the core a pure factory.
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
  /**
   * Veto/datum seam for the keyboard open gesture (`Shift+F10`). Evaluated
   * before `preventDefault()`, mirroring {@link resolveOpen}; the resolved
   * context goes through {@link commitContext} exactly like a pointer open,
   * so a keyboard open never serves a stale datum from an earlier
   * right-click. Defaults to always-open with `undefined` context.
   */
  readonly resolveKeyboardOpen?: (event: KeyboardEvent) => CngxContextMenuOpenDecision;
  /** Receives the resolved context on a successful open. No-op by default. */
  readonly commitContext?: (context: unknown) => void;
}

/**
 * Shared context-menu trigger core. Owns the `contextmenu` / `Shift+F10`
 * handling, the transient pointer-anchor lifecycle, the dismiss binding,
 * announcer calls, and focus save/restore. Consumed by both
 * `CngxContextMenuTrigger` (directive) and `CngxContextMenuFor` (organism
 * trigger) so the two share one implementation without inheritance.
 */
export interface CngxContextMenuTriggerCore {
  /** The dismissal source that closed the menu most recently. */
  readonly lastDismissSource: Signal<CngxMenuDismissSource | null>;
  /**
   * The core's submenu focus-stack model. Exposed for host-side wiring the
   * pure factory cannot install itself - the DI hosts pass it to
   * `connectSubmenuHoverToFocusStack` (an `effect`, so it needs their
   * injection context) to route submenu hover intent through the stack.
   */
  readonly focusStack: CngxMenuFocusStack;
  /** `contextmenu` host handler - consults `resolveOpen` before opening. */
  handleContextMenu(event: MouseEvent): void;
  /**
   * Keydown host handler - `Shift+F10` opens at the host centre; while open,
   * a key from outside the root popover routes through the shared menu
   * lifecycle (submenu keys, and navigation to an open submenu).
   */
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
   * Record that the active item's submenu is already open, pushing it onto
   * the focus stack WITHOUT re-opening it. Safety net for opens the stack did
   * not perform itself - the organism panel forwards it from the item's
   * `openAsSubmenu` terminal, covering programmatic opens; for hover and
   * click the stack already opened the submenu and this is an idempotent
   * no-op. No-op on a leaf.
   */
  noteActiveSubmenuOpened(): void;
  /** Drive from the directive's `isOpen` effect (inside `untracked`). */
  syncOpenState(open: boolean): void;
  /**
   * Relinquish an open WITHOUT restoring focus: detach the dismiss binding,
   * clear the submenu stack, and discard the saved pre-open focus. For the
   * shared-panel handoff - when a sibling trigger claims the still-visible
   * panel, the losing core must stand down silently; a `syncOpenState(false)`
   * would yank focus out of the menu the new owner just opened.
   */
  standDown(): void;
  /** Teardown - call from the directive's `DestroyRef.onDestroy`. */
  destroy(): void;
}

const DEFAULT_RESOLVE_OPEN = (): CngxContextMenuOpenDecision => ({
  open: true,
  context: undefined,
});

const DEFAULT_RESOLVE_KEYBOARD_OPEN = DEFAULT_RESOLVE_OPEN;

/**
 * Build a {@link CngxContextMenuTriggerCore} from its dependencies. Pure
 * factory - no Angular DI; the caller resolves collaborators and passes
 * them in.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/menu/context-menu-trigger-core.ts
 * @since 0.1.0
 */
export function createContextMenuTriggerCore(
  deps: CngxContextMenuTriggerCoreDeps,
): CngxContextMenuTriggerCore {
  const resolveOpen = deps.resolveOpen ?? DEFAULT_RESOLVE_OPEN;
  const resolveKeyboardOpen = deps.resolveKeyboardOpen ?? DEFAULT_RESOLVE_KEYBOARD_OPEN;
  const ariaLabels = coerceSignal(deps.menuConfig.ariaLabels);

  // Shared submenu focus-stack model and open / close / key-routing
  // lifecycle - the same focus model as CngxMenuTrigger.
  const focusStack = deps.focusStackFactory({
    rootMenu: () => deps.menu(),
    popover: () => deps.popover(),
    nav: deps.nav,
    document: deps.document,
  });

  const lifecycle = createMenuTriggerLifecycle({
    menu: () => deps.menu(),
    popover: () => deps.popover(),
    hostElement: deps.hostElement,
    menuConfig: deps.menuConfig,
    dismissFactory: deps.dismissFactory,
    focusStack,
    direction: deps.direction,
    onDismiss: () => deps.announcer.announce(ariaLabels().menuDismissed),
  });

  let virtualAnchor: HTMLElement | null = null;
  // Owner of the flip-chain claim, and the popover that holds it; a swapped
  // popover reference moves the claim on the next open.
  const claimOwner = {};
  let claimedOn: CngxContextMenuTriggerPopoverRef | null = null;

  const claimTryFallbacks = (popover: CngxContextMenuTriggerPopoverRef): void => {
    if (claimedOn === popover) {
      return;
    }
    claimedOn?.releasePositionTryFallbacks(claimOwner);
    popover.claimPositionTryFallbacks(claimOwner, deps.menuConfig.tryFallbacks);
    claimedOn = popover;
  };

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
    claimTryFallbacks(deps.popover());
    deps.popover().setAnchorElement(anchor);
    if (!deps.popover().isVisible()) {
      deps.popover().show();
    }
    // Run the open branch eagerly here, not only from the `isOpen` effect:
    // `showPopover()` makes the menu visible synchronously, but the effect
    // runs a change-detection flush later, leaving a visible-but-not-listening
    // window in which an immediate scroll / blur / outside-pointerdown would
    // fail to dismiss. `open()` is idempotent, so the effect's call is safe.
    lifecycle.open();
    deps.menu().ad.highlightFirst();
  };

  return {
    lastDismissSource: lifecycle.lastDismissSource,
    focusStack,
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
      if (isMenuShortcutCombo(event)) {
        return;
      }
      // Shift+F10 (the open gesture) first; Shift stays allowed.
      if (event.key === 'F10' && event.shiftKey) {
        const decision = resolveKeyboardOpen(event);
        if (!decision.open) {
          return;
        }
        event.preventDefault();
        deps.commitContext?.(decision.context);
        const rect = deps.hostElement.getBoundingClientRect();
        openAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
        return;
      }
      if (deps.popover().isVisible()) {
        lifecycle.routeHostKey(event);
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
        lifecycle.open();
      } else {
        lifecycle.close();
      }
    },
    standDown(): void {
      lifecycle.standDown();
    },
    destroy(): void {
      claimedOn?.releasePositionTryFallbacks(claimOwner);
      claimedOn = null;
      removeVirtualAnchor();
      lifecycle.destroy();
    },
  };
}
