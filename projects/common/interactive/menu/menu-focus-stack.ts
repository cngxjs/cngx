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
  /** Close every open submenu innermost-first, then hide the popover. */
  closeAll(): void;
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

  const openSubmenu = (submenu: CngxMenuSubmenuLike): void => {
    submenu.open();
    submenuStack.update((s) => [...s, submenu.inner]);
    submenu.inner.ad.highlightFirst();
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

  const closeAll = (): void => {
    const stack = submenuStack();
    for (let i = stack.length - 1; i >= 0; i--) {
      const inner = stack[i];
      const parent = i === 0 ? deps.rootMenu() : stack[i - 1];
      const submenu = parent.submenuItems().find((s) => s.inner === inner);
      submenu?.close();
    }
    submenuStack.set([]);
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
    closeAll,
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
