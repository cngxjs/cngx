import { DOCUMENT } from '@angular/common';
import { computed, Directive, effect, inject, input, signal, untracked } from '@angular/core';

import type { CngxMenuHost } from './menu-host.token';
import { CNGX_MENU_NAV_STRATEGY } from './menu-nav-strategy';
import type { CngxMenuSubmenuLike } from './menu-submenu.token';

/** See `CngxListboxTrigger` — same structural contract. */
interface PopoverController {
  readonly isVisible: () => boolean;
  show(): void;
  hide(): void;
}

/**
 * Trigger atom for dropdown menus.
 *
 * Pairs a focusable element with a `CngxMenu` and a `CngxPopover` through
 * explicit template references — identical keyboard model to
 * `CngxListboxTrigger` except `closeOnSelect` is hardcoded `true` (menu
 * semantics: activating an item dismisses the menu).
 *
 * Carries a focus-stack model for nested submenus: when a submenu opens,
 * its inner `CngxMenu` is pushed onto the stack so subsequent ArrowDown /
 * Up / Home / End / Enter target the submenu's items via its own
 * `CngxActiveDescendant`. ArrowLeft / Escape pop the stack and close the
 * top submenu.
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxMenuTrigger]',
  exportAs: 'cngxMenuTrigger',
  standalone: true,
  host: {
    '[attr.aria-haspopup]': '"menu"',
    '[attr.aria-expanded]': 'isOpen()',
    '(keydown)': 'handleKeydown($event)',
  },
})
export class CngxMenuTrigger {
  /** Menu controlled by this trigger. */
  readonly menu = input.required<CngxMenuHost>({ alias: 'cngxMenuTrigger' });
  /** Popover that wraps the menu panel. */
  readonly popover = input.required<PopoverController>();

  /** Mirrors `CngxPopover.isVisible()`. */
  readonly isOpen = computed<boolean>(() => this.popover().isVisible());

  private readonly nav = inject(CNGX_MENU_NAV_STRATEGY);

  /**
   * Active submenu chain — empty when only the outer menu is open. Each
   * entry is the `inner` host of an open submenu, top entry being the
   * deepest. Keystrokes target the top entry's AD.
   */
  private readonly submenuStack = signal<readonly CngxMenuHost[]>([]);

  /**
   * Focused element captured at popover-open time. Restored after close via
   * `queueMicrotask` so the focus write happens after the popover-close DOM
   * mutation settles. Captured reactively via the `isOpen` effect below so
   * mouse-driven open paths (consumer's `(click)="pop.toggle()"`) get the
   * same treatment as keyboard-driven open paths.
   */
  private savedFocus: HTMLElement | null = null;

  private readonly doc = inject(DOCUMENT);

  constructor() {
    effect(() => {
      const open = this.isOpen();
      untracked(() => {
        if (open && this.savedFocus === null) {
          const active = this.doc.activeElement;
          this.savedFocus = active instanceof HTMLElement ? active : null;
        } else if (!open && this.savedFocus !== null) {
          this.restoreFocus();
        }
      });
    });
  }

  private effectiveMenu(): CngxMenuHost {
    const stack = this.submenuStack();
    return stack.length === 0 ? this.menu() : stack[stack.length - 1];
  }

  protected handleKeydown(event: KeyboardEvent): void {
    const key = event.key;

    if (!this.isOpen()) {
      if (key === 'ArrowDown' || key === 'Enter' || key === ' ') {
        event.preventDefault();
        this.popover().show();
        this.menu().ad.highlightFirst();
        return;
      }
      if (key === 'ArrowUp') {
        event.preventDefault();
        this.popover().show();
        this.menu().ad.highlightLast();
        return;
      }
      return;
    }

    const menu = this.effectiveMenu();
    const ad = menu.ad;

    switch (key) {
      case 'Escape':
        event.preventDefault();
        if (this.submenuStack().length > 0) {
          event.stopPropagation();
          this.popSubmenu();
        } else {
          this.popover().hide();
        }
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
        this.handleArrowRight(menu, ad, event);
        return;
      case 'ArrowLeft':
        this.handleArrowLeft(ad, event);
        return;
      case 'Enter':
      case ' ':
        this.handleActivation(menu, ad, event);
        return;
    }
  }

  private handleArrowRight(menu: CngxMenuHost, ad: CngxMenuHost['ad'], event: KeyboardEvent): void {
    const activeId = ad.activeId();
    const submenu = this.findSubmenu(menu, activeId);
    const action = this.nav.onArrowRight({
      activeId,
      hasSubmenu: !!submenu,
      submenuOpen: submenu?.isOpen() ?? false,
    });
    if (action.kind === 'open-submenu' && submenu) {
      event.preventDefault();
      this.openSubmenu(submenu);
    }
  }

  private handleArrowLeft(ad: CngxMenuHost['ad'], event: KeyboardEvent): void {
    const stackOpen = this.submenuStack().length > 0;
    const action = this.nav.onArrowLeft({
      activeId: ad.activeId(),
      hasSubmenu: false,
      submenuOpen: stackOpen,
    });
    if (action.kind === 'close-submenu' && stackOpen) {
      event.preventDefault();
      this.popSubmenu();
    }
  }

  private handleActivation(menu: CngxMenuHost, ad: CngxMenuHost['ad'], event: KeyboardEvent): void {
    if (!ad.activeItem()) {
      return;
    }
    event.preventDefault();
    const submenu = this.findSubmenu(menu, ad.activeId());
    if (submenu) {
      this.openSubmenu(submenu);
    } else {
      ad.activateCurrent();
      this.closeAll();
    }
  }

  private findSubmenu(menu: CngxMenuHost, activeId: string | null): CngxMenuSubmenuLike | undefined {
    if (!activeId) {
      return undefined;
    }
    return menu.submenuItems().find((s) => s.id === activeId);
  }

  private openSubmenu(submenu: CngxMenuSubmenuLike): void {
    submenu.open();
    this.submenuStack.update((s) => [...s, submenu.inner]);
    submenu.inner.ad.highlightFirst();
  }

  private popSubmenu(): void {
    const stack = this.submenuStack();
    if (stack.length === 0) {
      return;
    }
    const top = stack[stack.length - 1];
    const parent = stack.length === 1 ? this.menu() : stack[stack.length - 2];
    const submenu = parent.submenuItems().find((s) => s.inner === top);
    submenu?.close();
    this.submenuStack.update((prev) => prev.slice(0, -1));
  }

  private closeAll(): void {
    const stack = this.submenuStack();
    for (let i = stack.length - 1; i >= 0; i--) {
      const inner = stack[i];
      const parent = i === 0 ? this.menu() : stack[i - 1];
      const submenu = parent.submenuItems().find((s) => s.inner === inner);
      submenu?.close();
    }
    this.submenuStack.set([]);
    this.popover().hide();
  }

  private restoreFocus(): void {
    const target = this.savedFocus;
    this.savedFocus = null;
    if (!target) {
      return;
    }
    queueMicrotask(() => {
      target.focus();
    });
  }
}
