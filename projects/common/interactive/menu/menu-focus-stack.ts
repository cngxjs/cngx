import { InjectionToken, signal, type Signal } from '@angular/core';

import type { CngxMenuHost } from './menu-host.token';
import type { CngxMenuNavStrategy } from './menu-nav-strategy';
import type { CngxMenuSubmenuLike } from './menu-submenu.token';

/**
 * Minimal popover surface the focus stack hides when the outermost menu
 * level closes. Typed structurally to keep `@cngx/common/interactive` free
 * of a `@cngx/common/popover` import (menu-accepted-debt §7).
 *
 * @category common/interactive/menu
 */
export interface CngxMenuFocusStackPopoverRef {
  hide(): void;
}

/**
 * Dependencies for {@link createMenuFocusStack}. The caller injects the
 * keyboard policy and `Document` and passes them in, so the factory itself
 * stays pure and swappable via {@link CNGX_MENU_FOCUS_STACK_FACTORY}.
 *
 * @category common/interactive/menu
 */
export interface CngxMenuFocusStackDeps {
  /** Root menu host - the bottom of the submenu chain. */
  readonly rootMenu: () => CngxMenuHost;
  /** Popover to hide when the outermost level closes. */
  readonly popover: () => CngxMenuFocusStackPopoverRef;
  /** Keyboard policy consulted on ArrowRight / ArrowLeft. */
  readonly nav: CngxMenuNavStrategy;
  /** Document used to capture the pre-open focus target. */
  readonly document: Document;
}

/**
 * Submenu focus-stack model shared by `CngxMenuTrigger` and the
 * context-menu trigger core. Owns the active submenu chain, the
 * saved-focus slot restored after close, and the W3C APG
 * ArrowRight / ArrowLeft / Escape / activation routing.
 *
 * @category common/interactive/menu
 */
export interface CngxMenuFocusStack {
  /** Active submenu chain - empty when only the root menu is open. */
  readonly stack: Signal<readonly CngxMenuHost[]>;
  /** Top-of-stack menu host, or the root when the stack is empty. */
  effectiveMenu(): CngxMenuHost;
  /** Capture the currently focused element (once) for post-close restore. */
  captureFocus(): void;
  /** Restore focus to the captured element after the close DOM settles. */
  restoreFocus(): void;
  /** Escape: pop the innermost submenu, or hide the popover at the root. */
  handleEscape(event: KeyboardEvent): void;
  /** ArrowRight: open the active item's submenu when the policy allows. */
  handleArrowRight(menu: CngxMenuHost, event: KeyboardEvent): void;
  /** ArrowLeft: pop the current submenu level when one is open. */
  handleArrowLeft(menu: CngxMenuHost, event: KeyboardEvent): void;
  /** Enter/Space: open a submenu parent, else activate the leaf and close. */
  handleActivation(menu: CngxMenuHost, event: KeyboardEvent): void;
  /**
   * Open a specific submenu through the stack - the single open-only primitive
   * shared by keyboard activation, pointer click, and hover. Delegates to the
   * same private open the ArrowRight path uses: opens the submenu popover
   * (flipping its `aria-expanded`), pushes the inner menu onto the stack, and
   * highlights the inner menu's first item. Idempotent - a no-op when the
   * submenu's inner menu is already on the stack, so repeated activation or
   * hover never double-pushes.
   */
  openSubmenuFor(submenu: CngxMenuSubmenuLike): void;
  /**
   * Record that a submenu is already open, pushing its inner menu onto the
   * stack and highlighting the first item WITHOUT calling `submenu.open()`.
   * The organism's hover path shows the submenu popover through its own facade
   * and then calls this, so a hover-opened submenu is stack-tracked (ArrowLeft
   * / Escape pop it) exactly like a keyboard- or click-opened one, with no risk
   * of re-entering the open path. Idempotent once the submenu is on the stack.
   */
  noteSubmenuOpened(submenu: CngxMenuSubmenuLike): void;
  /** Close every open submenu innermost-first, then hide the popover. */
  closeAll(): void;
  /**
   * Close every open submenu innermost-first and clear the stack WITHOUT
   * hiding the root popover. Called on the trigger's close path so a stale
   * submenu chain never survives a non-Escape dismissal (outside-click, blur,
   * scroll): the root popover is already closing, and a reopened menu must
   * start from the root, not a submenu that no longer exists.
   */
  reset(): void;
}

/**
 * Factory that builds a {@link CngxMenuFocusStack} from its dependencies.
 * Matches the token {@link CNGX_MENU_FOCUS_STACK_FACTORY} so consumers can
 * swap the focus-stack model (alternative keyboard pattern, telemetry
 * wrapping, test double) enterprise-wide.
 *
 * @category common/interactive/menu
 */
export type CngxMenuFocusStackFactory = (deps: CngxMenuFocusStackDeps) => CngxMenuFocusStack;

/**
 * Default focus-stack implementation. Behaviour matches the W3C APG Menu
 * Button pattern that `CngxMenuTrigger` shipped inline before extraction.
 *
 * @category common/interactive/menu
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/menu/menu-focus-stack.ts
 * @since 0.1.0
 */
export function createMenuFocusStack(deps: CngxMenuFocusStackDeps): CngxMenuFocusStack {
  const submenuStack = signal<readonly CngxMenuHost[]>([]);
  let savedFocus: HTMLElement | null = null;

  const effectiveMenu = (): CngxMenuHost => {
    const stack = submenuStack();
    return stack.length === 0 ? deps.rootMenu() : stack[stack.length - 1];
  };

  const findSubmenu = (
    menu: CngxMenuHost,
    activeId: string | null,
  ): CngxMenuSubmenuLike | undefined => {
    if (!activeId) {
      return undefined;
    }
    return menu.submenuItems().find((s) => s.id === activeId);
  };

  // Push the submenu's inner menu onto the stack and highlight its first item,
  // but only once - the terminal show (organism hover facade) and the open
  // paths (ArrowRight / click) both funnel here, so the guard keeps a submenu
  // from being pushed or re-highlighted twice. `inner` is null for an inert
  // brain: the context-menu organism applies CngxMenuItemSubmenu to every item,
  // so leaf items register a submenu-less brain whose `inner` never resolves.
  // Skip those - a leaf has no submenu to track.
  const pushIfAbsent = (submenu: CngxMenuSubmenuLike): void => {
    const inner = submenu.inner as CngxMenuHost | null;
    if (inner === null || submenuStack().includes(inner)) {
      return;
    }
    submenuStack.update((s) => [...s, inner]);
    inner.ad.highlightFirst();
  };

  const openSubmenu = (submenu: CngxMenuSubmenuLike): void => {
    submenu.open();
    pushIfAbsent(submenu);
  };

  const popSubmenu = (): void => {
    const stack = submenuStack();
    if (stack.length === 0) {
      return;
    }
    const top = stack[stack.length - 1];
    const parent = stack.length === 1 ? deps.rootMenu() : stack[stack.length - 2];
    const submenu = parent.submenuItems().find((s) => s.inner === top);
    submenu?.close();
    submenuStack.update((prev) => prev.slice(0, -1));
  };

  const reset = (): void => {
    const stack = submenuStack();
    for (let i = stack.length - 1; i >= 0; i--) {
      const inner = stack[i];
      const parent = i === 0 ? deps.rootMenu() : stack[i - 1];
      const submenu = parent.submenuItems().find((s) => s.inner === inner);
      submenu?.close();
    }
    submenuStack.set([]);
  };

  const closeAll = (): void => {
    reset();
    deps.popover().hide();
  };

  return {
    stack: submenuStack.asReadonly(),
    effectiveMenu,
    captureFocus(): void {
      if (savedFocus === null) {
        const active = deps.document.activeElement;
        savedFocus = active instanceof HTMLElement ? active : null;
      }
    },
    restoreFocus(): void {
      const target = savedFocus;
      savedFocus = null;
      if (!target) {
        return;
      }
      queueMicrotask(() => {
        target.focus();
      });
    },
    handleEscape(event: KeyboardEvent): void {
      event.preventDefault();
      if (submenuStack().length > 0) {
        event.stopPropagation();
        popSubmenu();
      } else {
        deps.popover().hide();
      }
    },
    handleArrowRight(menu: CngxMenuHost, event: KeyboardEvent): void {
      const activeId = menu.ad.activeId();
      const submenu = findSubmenu(menu, activeId);
      const action = deps.nav.onArrowRight({
        activeId,
        hasSubmenu: !!submenu,
        submenuOpen: submenu?.isOpen() ?? false,
      });
      if (action.kind === 'open-submenu' && submenu) {
        event.preventDefault();
        openSubmenu(submenu);
      }
    },
    handleArrowLeft(menu: CngxMenuHost, event: KeyboardEvent): void {
      const stackOpen = submenuStack().length > 0;
      const action = deps.nav.onArrowLeft({
        activeId: menu.ad.activeId(),
        hasSubmenu: false,
        submenuOpen: stackOpen,
      });
      if (action.kind === 'close-submenu' && stackOpen) {
        event.preventDefault();
        popSubmenu();
      }
    },
    handleActivation(menu: CngxMenuHost, event: KeyboardEvent): void {
      const ad = menu.ad;
      if (!ad.activeItem()) {
        return;
      }
      event.preventDefault();
      const submenu = findSubmenu(menu, ad.activeId());
      if (submenu) {
        openSubmenu(submenu);
      } else {
        ad.activateCurrent();
        closeAll();
      }
    },
    openSubmenuFor(submenu: CngxMenuSubmenuLike): void {
      if (submenuStack().includes(submenu.inner)) {
        return;
      }
      openSubmenu(submenu);
    },
    noteSubmenuOpened(submenu: CngxMenuSubmenuLike): void {
      pushIfAbsent(submenu);
    },
    closeAll,
    reset,
  };
}

/**
 * DI token carrying the {@link CngxMenuFocusStackFactory}. Defaults to
 * {@link createMenuFocusStack}; override via `providers` / `viewProviders`
 * to swap the submenu focus-stack model (non-W3C keyboard routing,
 * telemetry-wrapped traversal, test-doubled stack) without forking the
 * trigger.
 *
 * @category common/interactive/menu
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/menu/menu-focus-stack.ts
 * @since 0.1.0
 * @relatedTo CngxMenuTrigger, CngxContextMenuTrigger, CNGX_MENU_NAV_STRATEGY
 */
export const CNGX_MENU_FOCUS_STACK_FACTORY = new InjectionToken<CngxMenuFocusStackFactory>(
  'CNGX_MENU_FOCUS_STACK_FACTORY',
  { providedIn: 'root', factory: () => createMenuFocusStack },
);
