import { type Signal } from '@angular/core';
import { resolveInlineArrowKey, type CngxDirection } from '@cngx/core';

import {
  createMenuTriggerDismissBinding,
  type CngxMenuDismissHandlerFactory,
  type CngxMenuDismissPopoverRef,
  type CngxMenuDismissSource,
} from './dismiss-handler';
import type { CngxMenuConfig } from './menu-config';
import type { CngxMenuFocusStack } from './menu-focus-stack';
import type { CngxMenuHost } from './menu-host.token';

/** Keys routed to the innermost menu while a submenu is open. */
const SUBMENU_ROUTED_KEYS: ReadonlySet<string> = new Set([
  'Escape',
  'ArrowDown',
  'ArrowUp',
  'Home',
  'End',
  'Enter',
  ' ',
]);

/**
 * `true` for a Ctrl / Cmd / Alt combo. Menu triggers never hijack browser or
 * app shortcuts; Shift stays allowed.
 */
export function isMenuShortcutCombo(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.metaKey || event.altKey;
}

/** Dependencies for {@link createMenuTriggerLifecycle}. */
export interface CngxMenuTriggerLifecycleDeps {
  /** Root menu of the trigger. */
  readonly menu: () => CngxMenuHost;
  /** Popover that wraps the root menu. */
  readonly popover: () => CngxMenuDismissPopoverRef;
  /** Trigger host element - the dismiss filter and the focus-out target. */
  readonly hostElement: HTMLElement;
  /** Menu config supplying the dismissal toggles. */
  readonly menuConfig: CngxMenuConfig;
  /** Dismiss-handler factory (from `CNGX_MENU_DISMISS_HANDLER_FACTORY`). */
  readonly dismissFactory: CngxMenuDismissHandlerFactory;
  /** Submenu focus-stack model (from `CNGX_MENU_FOCUS_STACK_FACTORY`). */
  readonly focusStack: CngxMenuFocusStack;
  /** Writing direction - resolves the physical arrow to its inline intent. */
  readonly direction: Signal<CngxDirection>;
  /** Runs after a dismissal source closed the menu (announcer hook). */
  readonly onDismiss?: (source: CngxMenuDismissSource) => void;
}

/**
 * Open / close / key-routing lifecycle shared by `CngxMenuTrigger` and the
 * context-menu trigger core, so both triggers run one focus model (WAI-ARIA
 * APG Menu Button): focus moves into the root menu a microtask after open,
 * the root menu's `CngxActiveDescendant` owns navigation, and the trigger
 * routes the submenu keys plus, while a submenu is open, every navigation
 * key to the innermost menu.
 *
 * Propagation rule for keys that reach the root popover's capture listener:
 * while a submenu is open, navigation keys are routed to it and do not reach
 * listeners inside the root menu (the root `CngxActiveDescendant` must not
 * move too). With no submenu open, ArrowRight / ArrowLeft are routed (to
 * open a submenu) but keep propagating, since a vertical root menu ignores
 * them; only a `horizontal` root menu has them stopped.
 *
 * @internal
 */
export interface CngxMenuTriggerLifecycle {
  /** The dismissal source that closed the menu most recently. */
  readonly lastDismissSource: Signal<CngxMenuDismissSource | null>;
  /**
   * Open branch: capture the pre-open focus, install the dismiss listeners
   * and the popover's capture keydown, and schedule the focus move into the
   * root menu. Idempotent within one open cycle.
   */
  open(): void;
  /**
   * Close branch: remove the listeners, cancel a pending focus move, clear
   * the submenu chain and hand the closing source to the focus stack's
   * `settleFocus`, which owns the restore-or-discard policy. Focus settles
   * only when an open cycle is active, so the caller's mount-time
   * `isOpen() === false` run settles nothing. The teardown half always runs:
   * a submenu can be pushed by a routed key before the `isOpen` effect ran
   * `open()`, and the next open must still start from the root.
   */
  close(): void;
  /**
   * Relinquish an open without settling focus (shared-panel handoff): the
   * new owner holds focus, so the saved focus is discarded.
   */
  standDown(): void;
  /**
   * Open-state key routing for a keydown that reached the trigger host
   * (the microtask window before focus lands in the menu, or a host that
   * forwards keys). Keys that originate inside the root popover are left to
   * its capture listener, which saw them first.
   */
  routeHostKey(event: KeyboardEvent): void;
  /** Teardown. */
  destroy(): void;
}

/**
 * Build a {@link CngxMenuTriggerLifecycle}. Pure factory - the caller
 * injects the collaborators and drives `open` / `close` from its `isOpen`
 * effect (inside `untracked`).
 *
 * @internal
 */
export function createMenuTriggerLifecycle(
  deps: CngxMenuTriggerLifecycleDeps,
): CngxMenuTriggerLifecycle {
  const { focusStack } = deps;

  const chainContains = (node: Node): boolean =>
    [deps.menu(), ...focusStack.stack()].some((m) => m.contains(node));

  const dismissBinding = createMenuTriggerDismissBinding({
    popover: () => deps.popover(),
    hostElement: deps.hostElement,
    menuConfig: deps.menuConfig,
    factory: deps.dismissFactory,
    menuChainContains: chainContains,
    onDismiss: (source) => deps.onDismiss?.(source),
  });

  // Only the root popover carries the capture listener; a key forwarded from
  // a submenu panel (the context-menu organism routes those up) still routes.
  const isInsideRootPopover = (target: EventTarget | null): boolean =>
    target instanceof Node && deps.popover().elementRef.nativeElement.contains(target);

  // Bumped on every close / destroy so a focus move queued by an earlier
  // open never lands after the menu closed or the trigger was destroyed.
  let focusTicket = 0;
  let destroyed = false;
  // Set by open(), cleared by close / standDown / destroy: settleFocus runs
  // only when an open cycle actually ends.
  let cycleOpen = false;

  const scheduleMenuFocus = (): void => {
    const ticket = ++focusTicket;
    // One microtask lets showPopover()'s top-layer mutation settle first.
    queueMicrotask(() => {
      if (ticket === focusTicket && !destroyed && deps.popover().isVisible()) {
        deps.menu().focus();
      }
    });
  };

  const route = (event: KeyboardEvent, fromMenu: boolean): void => {
    if (isMenuShortcutCombo(event)) {
      return;
    }
    const logical = resolveInlineArrowKey(event.key, deps.direction());
    const submenuKey = logical === 'ArrowRight' || logical === 'ArrowLeft';
    const submenuOpen = focusStack.stack().length > 0;
    if (!submenuKey) {
      if (!SUBMENU_ROUTED_KEYS.has(logical)) {
        return;
      }
      // Root Escape stays with CngxPopover, which owns closeOnEscape.
      if (logical === 'Escape' && !submenuOpen) {
        return;
      }
      // From the focused root menu, its own CngxActiveDescendant navigates.
      if (fromMenu && !submenuOpen) {
        return;
      }
    }
    // Stop only when the root AD would also act. While a submenu is open the
    // key belongs to the innermost menu. With the stack empty only the
    // horizontal arrows get here: a vertical root AD ignores them (no move,
    // no preventDefault), so they bubble on to consumer listeners; a
    // horizontal root AD would step its highlight on them, so stop those.
    // `stopImmediatePropagation`, because the root popover can be the menu
    // element itself (the context-menu organism), where the AD listens on
    // the same node.
    const rootAdActs = submenuOpen || deps.menu().ad.orientation() === 'horizontal';
    if (fromMenu && rootAdActs) {
      event.stopImmediatePropagation();
    }

    const menu = focusStack.effectiveMenu();
    const ad = menu.ad;
    switch (logical) {
      case 'Escape':
        focusStack.handleEscape(event);
        return;
      case 'ArrowDown':
        event.preventDefault();
        ad.highlightNext();
        return;
      case 'ArrowUp':
        event.preventDefault();
        ad.highlightPrev();
        return;
      case 'Home':
        event.preventDefault();
        ad.highlightFirst();
        return;
      case 'End':
        event.preventDefault();
        ad.highlightLast();
        return;
      case 'ArrowRight':
        focusStack.handleArrowRight(menu, event);
        return;
      case 'ArrowLeft':
        focusStack.handleArrowLeft(menu, event);
        return;
      case 'Enter':
      case ' ':
        focusStack.handleActivation(menu, event);
        return;
    }
  };

  // Capture phase on the popover element: once focus sits in the menu the
  // trigger host no longer sees keys, so the submenu routing runs here,
  // before the root menu's own CngxActiveDescendant.
  const onMenuKeydown = (event: KeyboardEvent): void => route(event, true);
  let keydownTarget: HTMLElement | null = null;

  const attachKeydown = (): void => {
    const el = deps.popover().elementRef.nativeElement;
    if (keydownTarget === el) {
      return;
    }
    detachKeydown();
    el.addEventListener('keydown', onMenuKeydown, { capture: true });
    keydownTarget = el;
  };

  const detachKeydown = (): void => {
    keydownTarget?.removeEventListener('keydown', onMenuKeydown, { capture: true });
    keydownTarget = null;
  };

  // The close event of the popover, subscribed once per popover reference and
  // kept across open cycles: every close, whichever path took it, drops the
  // highlight in the subscription callback, so an open gesture stored while
  // the menu had no items never lands on a closed menu.
  type ClosedOutput = NonNullable<CngxMenuDismissPopoverRef['closed']>;
  let closedSource: ClosedOutput | null = null;
  let closedSubscription: { unsubscribe(): void } | null = null;

  const attachClosed = (): void => {
    const closed = deps.popover().closed ?? null;
    if (closed === closedSource) {
      return;
    }
    detachClosed();
    closedSource = closed;
    closedSubscription = closed?.subscribe(() => deps.menu().ad.resetHighlight()) ?? null;
  };

  const detachClosed = (): void => {
    closedSubscription?.unsubscribe();
    closedSubscription = null;
    closedSource = null;
  };

  const release = (): void => {
    focusTicket++;
    dismissBinding.detach();
    detachKeydown();
    focusStack.reset();
  };

  return {
    lastDismissSource: dismissBinding.lastSource,
    open(): void {
      cycleOpen = true;
      focusStack.captureFocus();
      dismissBinding.attach();
      attachKeydown();
      attachClosed();
      scheduleMenuFocus();
    },
    close(): void {
      release();
      if (!cycleOpen) {
        return;
      }
      cycleOpen = false;
      focusStack.settleFocus(dismissBinding.closedBy());
    },
    standDown(): void {
      cycleOpen = false;
      release();
      focusStack.discardFocus();
    },
    routeHostKey(event: KeyboardEvent): void {
      if (isInsideRootPopover(event.target)) {
        return;
      }
      route(event, false);
    },
    destroy(): void {
      destroyed = true;
      cycleOpen = false;
      focusTicket++;
      dismissBinding.detach();
      detachKeydown();
      detachClosed();
    },
  };
}
