import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  untracked,
  type Signal,
} from '@angular/core';
import { outputToObservable } from '@angular/core/rxjs-interop';
import { injectDirection, resolveInlineArrowKey } from '@cngx/core';
import { coerceSignal } from '@cngx/core/utils';
import { cngxDevWarn } from '@cngx/utils';

import { injectHostInteractionBlocked } from '../trigger-guard/host-interaction-blocked';
import {
  CNGX_MENU_DISMISS_HANDLER_FACTORY,
  createMenuTriggerDismissBinding,
  type CngxMenuDismissPopoverRef,
} from './dismiss-handler';
import { CNGX_MENU_ANNOUNCER_FACTORY } from './menu-announcer';
import { injectMenuConfig } from './menu-config';
import {
  CNGX_MENU_FOCUS_STACK_FACTORY,
  connectSubmenuHoverToFocusStack,
} from './menu-focus-stack';
import type { CngxMenuHost } from './menu-host.token';
import { CNGX_MENU_NAV_STRATEGY } from './menu-nav-strategy';

/** Keys the popover listener routes to an open submenu instead of the root menu. */
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
 * See `CngxListboxTrigger` - same structural contract, plus the two composer
 * hints the popover trigger reads for `aria-haspopup` and `aria-controls`.
 */
interface PopoverController extends CngxMenuDismissPopoverRef {
  show(): void;
  setHaspopup(value: 'menu' | undefined): void;
  setControls(source: Signal<string> | null): void;
}

/**
 * Trigger atom for dropdown menus.
 *
 * Pairs a focusable element with a `CngxMenu` and a `CngxPopover` through
 * explicit template references - identical keyboard model to
 * `CngxListboxTrigger` except `closeOnSelect` is hardcoded `true` (menu
 * semantics: activating an item dismisses the menu).
 *
 * Carries a focus-stack model for nested submenus: when a submenu opens,
 * its inner `CngxMenu` is pushed onto the stack so subsequent ArrowDown /
 * Up / Home / End / Enter target the submenu's items via its own
 * `CngxActiveDescendant`. ArrowLeft / Escape pop the stack and close the
 * top submenu. The stack model is supplied by
 * {@link CNGX_MENU_FOCUS_STACK_FACTORY}, so it is shared verbatim with the
 * context-menu trigger core and swappable enterprise-wide.
 *
 * ### Blocked host
 *
 * A blocked host opens on no key: native `disabled`, `aria-disabled="true"`,
 * or a co-hosted cngx button reporting `disabled` (a disabled `cngxButton`
 * stays focusable, so keydown still arrives). When a cngx button becomes
 * disabled while the panel is open, the panel closes. The trigger guards
 * only the keys it handles: a `(click)="pop.toggle()"` on a plain button
 * is the consumer's and must check the blocked state itself; the
 * `cngxMenuButton` / `cngxIconMenuButton` hosts return early from their
 * click while blocked.
 *
 * ### Focus model
 *
 * WAI-ARIA APG Menu Button Pattern: after the menu opens, DOM focus moves
 * into the `role="menu"` element (a microtask after open, so the popover's
 * top-layer mutation settles first), and the menu's own
 * `CngxActiveDescendant` owns `aria-activedescendant` and Down / Up /
 * Home / End / Enter / Space / typeahead. Every open path moves focus; the
 * keyboard opens highlight the first or last item, a pointer open leaves
 * the highlight empty until the first arrow key. The trigger routes only
 * the submenu keys (ArrowRight / ArrowLeft) through a capture listener on
 * the popover, and while a submenu is open every navigation key and
 * Escape to the innermost menu. Escape at the root, an item activation and
 * every dismissal except a focus-out restore focus to the trigger. The
 * context-menu trigger uses the same model.
 *
 * ### ARIA
 *
 * The co-hosted `CngxPopoverTrigger` is the single writer of
 * `aria-haspopup`, `aria-expanded` and `aria-controls`. This trigger
 * registers `menu` as the popover's haspopup hint and the menu's id as its
 * controls hint, so `aria-controls` names the `role="menu"` element. A
 * trigger without a co-hosted `[cngxPopoverTrigger]` emits none of the
 * three (dev builds warn `CNGX1074`).
 *
 * ### Dismissal
 *
 * Five dismissal sources close the menu by default: `Escape`, `pointerdown`
 * outside both the popover and the trigger host, window `blur`, document
 * `pointercancel`, and focus leaving the trigger and the open menu chain
 * (`Tab` / `Shift+Tab` out of the menu, `'focus-out'`). Window `scroll` is
 * opt-in via {@link withDismissOnScroll}. A focus-out close keeps focus
 * where the user moved it; every other source restores focus to the
 * trigger. The source that fired most recently is readable through
 * {@link lastDismissSource}.
 *
 * Override individual sources at app root with `withDismissOnOutsideClick`,
 * `withDismissOnScroll`, `withDismissOnBlur`, `withDismissOnFocusOut`, or
 * swap the whole handler via
 * {@link CNGX_MENU_DISMISS_HANDLER_FACTORY} for telemetry-wrapped or
 * test-doubled dismissal.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/menu/menu-trigger.directive.ts
 * @since 0.1.0
 * @relatedTo CngxMenu, CngxContextMenuTrigger, CngxMenuItemSubmenu, CngxPopoverTrigger, CngxMenuButton
 * <example-url>/#/common/interactive/menu/submenu/two-level-submenu</example-url>
 * <example-url>/#/common/interactive/menu/trigger/dropdown-menu</example-url>
 * <example-url>/#/common/menu-button/menu-button/basic</example-url>
 * @axis level molecule
 */
@Directive({
  selector: '[cngxMenuTrigger]',
  exportAs: 'cngxMenuTrigger',
  standalone: true,
  host: {
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

  private readonly doc = inject(DOCUMENT);
  private readonly direction = injectDirection();
  private readonly hostElRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly menuConfig = injectMenuConfig();
  private readonly ariaLabels = coerceSignal(this.menuConfig.ariaLabels);
  private readonly announcer = inject(CNGX_MENU_ANNOUNCER_FACTORY)();

  /**
   * Submenu focus-stack model - the active submenu chain, the saved-focus
   * slot restored after close, and the ArrowRight / ArrowLeft / Escape /
   * activation routing that consults `CNGX_MENU_NAV_STRATEGY`. Shared with
   * the context-menu trigger core via {@link CNGX_MENU_FOCUS_STACK_FACTORY}.
   */
  private readonly focusStack = inject(CNGX_MENU_FOCUS_STACK_FACTORY)({
    rootMenu: () => this.menu(),
    popover: () => this.popover(),
    nav: inject(CNGX_MENU_NAV_STRATEGY),
    document: this.doc,
  });

  private readonly dismissBinding = createMenuTriggerDismissBinding({
    popover: () => this.popover(),
    hostElement: this.hostElRef.nativeElement,
    menuConfig: this.menuConfig,
    factory: inject(CNGX_MENU_DISMISS_HANDLER_FACTORY),
    menuChainContains: (node) =>
      [this.menu(), ...this.focusStack.stack()].some((m) => m.contains(node)),
    onDismiss: () => this.announcer.announce(this.ariaLabels().menuDismissed),
  });

  /**
   * The dismissal source that closed the menu most recently. `null`
   * before the first close. Surface for demos, telemetry, and audit
   * sinks - reads which path fired without re-installing listeners.
   */
  readonly lastDismissSource = this.dismissBinding.lastSource;

  /** A disabled `cngxButton` stays focusable, so keydown still reaches the trigger. */
  private readonly hostGuard = injectHostInteractionBlocked({
    isOpen: () => this.isOpen(),
    close: () => this.popover().hide(),
  });

  /**
   * Capture-phase keydown on the popover element: once focus sits in the
   * menu, the trigger host no longer sees keys, so the submenu routing runs
   * here before the root menu's own `CngxActiveDescendant`.
   */
  private readonly menuKeydown = (event: KeyboardEvent): void => {
    this.routeOpenKey(event, true);
  };
  private menuKeydownTarget: HTMLElement | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.dismissBinding.detach();
      this.detachMenuKeydown();
    });
    // Composer hints for the co-hosted CngxPopoverTrigger, the single writer
    // of aria-haspopup / aria-expanded / aria-controls. Tracks only the two
    // references; the menu id Signal itself is registered, so an id change
    // reaches aria-controls without re-running this effect.
    effect((onCleanup) => {
      const pop = this.popover();
      const menu = this.menu();
      untracked(() => {
        pop.setHaspopup('menu');
        pop.setControls(menu.id);
      });
      onCleanup(() => {
        pop.setHaspopup(undefined);
        pop.setControls(null);
      });
    });
    effect(() => {
      const open = this.isOpen();
      untracked(() => {
        if (open) {
          this.focusStack.captureFocus();
          this.dismissBinding.attach();
          this.attachMenuKeydown();
          // Defer one microtask so showPopover()'s top-layer mutation settles
          // before focus moves into the menu (context-menu core precedent).
          queueMicrotask(() => {
            if (this.isOpen()) {
              this.menu().focus();
            }
          });
        } else {
          this.dismissBinding.detach();
          this.detachMenuKeydown();
          // Clear any open submenu chain so a non-Escape dismissal never leaves
          // a stale submenu on the stack for the next open (mirrors the
          // context-menu trigger core).
          this.focusStack.reset();
          // A focus-out close (Tab, Shift+Tab, focus moved elsewhere) leaves
          // focus where the user put it; every other close restores it.
          if (this.dismissBinding.closedBy() === 'focus-out') {
            this.focusStack.discardFocus?.();
          } else {
            this.focusStack.restoreFocus();
          }
        }
      });
    });
    // A pointer click on an item routes through its menu's `activated` output
    // (CngxMenuItem funnels click into `activateCurrent`), not the keydown
    // path: a submenu parent opens its submenu, a leaf closes the menu, the
    // pointer half of the hardcoded closeOnSelect. Every menu of the open
    // chain is listened to, so a leaf inside a submenu closes the whole menu.
    // Enter/Space reach the same idempotent `openSubmenuFor` / `closeAll`
    // through `handleActivation`, so nothing opens or closes twice.
    effect((onCleanup) => {
      const menus = [this.menu(), ...this.focusStack.stack()];
      const subs = menus.map((menu) =>
        outputToObservable(menu.ad.activated).subscribe(() => this.handleActivated(menu)),
      );
      onCleanup(() => subs.forEach((sub) => sub.unsubscribe()));
    });
    // Hover routing: submenu companions only derive debounced hover intent;
    // this connector routes the edges through the same openSubmenuFor /
    // closeSubmenuFor primitives keyboard and click use, so a hover-opened
    // submenu is stack-tracked (keyboard-visible, ArrowLeft/Escape pop it).
    connectSubmenuHoverToFocusStack({
      focusStack: this.focusStack,
      rootMenu: () => this.menu(),
      rootOpen: () => this.isOpen(),
    });
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      const host = this.hostElRef.nativeElement;
      afterNextRender(() => {
        if (host.hasAttribute('aria-expanded')) {
          return;
        }
        cngxDevWarn(
          'CNGX1074',
          '[cngxMenuTrigger] has no aria-expanded writer. Co-host [cngxPopoverTrigger] on the same element; it writes aria-haspopup, aria-expanded and aria-controls for the menu.',
          host,
        );
      });
    }
  }

  private attachMenuKeydown(): void {
    const el = this.popover().elementRef.nativeElement;
    if (this.menuKeydownTarget === el) {
      return;
    }
    this.detachMenuKeydown();
    el.addEventListener('keydown', this.menuKeydown, { capture: true });
    this.menuKeydownTarget = el;
  }

  private detachMenuKeydown(): void {
    this.menuKeydownTarget?.removeEventListener('keydown', this.menuKeydown, { capture: true });
    this.menuKeydownTarget = null;
  }

  private handleActivated(menu: CngxMenuHost): void {
    const activeId = menu.ad.activeId();
    const submenu = menu.submenuItems().find((s) => s.id === activeId);
    if (submenu) {
      this.focusStack.openSubmenuFor(submenu);
      return;
    }
    this.focusStack.closeAll();
  }

  protected handleKeydown(event: KeyboardEvent): void {
    // Never hijack browser/app shortcuts: Ctrl/Cmd/Alt combos pass through
    // untouched - the same guard the nav strategies and CngxListboxTrigger
    // apply. Shift stays allowed.
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    const key = event.key;

    if (!this.isOpen()) {
      if (this.hostGuard.isBlockedNow()) {
        return;
      }
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

    this.routeOpenKey(event, false);
  }

  /**
   * Open-state key routing, shared by the trigger host (`fromMenu: false`,
   * the microtask window before focus lands in the menu) and the popover
   * capture listener (`fromMenu: true`). From the menu with no submenu open,
   * only the submenu keys route here and the root menu's own
   * `CngxActiveDescendant` owns the rest (root Escape stays with the
   * popover). With a submenu open every navigation key goes to the innermost
   * menu and stops there, so the root highlight does not move.
   */
  private routeOpenKey(event: KeyboardEvent, fromMenu: boolean): void {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    const menu = this.focusStack.effectiveMenu();
    const ad = menu.ad;
    // Resolve the physical arrow to its inline-logical intent: under `rtl`
    // physical ArrowLeft opens the submenu and physical ArrowRight pops it.
    // Vertical / Home / End / activation keys pass through unchanged.
    const logical = resolveInlineArrowKey(event.key, this.direction());
    const submenuKey = logical === 'ArrowRight' || logical === 'ArrowLeft';
    if (fromMenu && !submenuKey) {
      if (this.focusStack.stack().length === 0 || !SUBMENU_ROUTED_KEYS.has(logical)) {
        return;
      }
      event.stopPropagation();
    }

    switch (logical) {
      case 'Escape':
        this.focusStack.handleEscape(event);
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
        this.focusStack.handleArrowRight(menu, event);
        return;
      case 'ArrowLeft':
        this.focusStack.handleArrowLeft(menu, event);
        return;
      case 'Enter':
      case ' ':
        this.focusStack.handleActivation(menu, event);
        return;
    }
  }
}
