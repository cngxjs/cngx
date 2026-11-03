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
import { injectDirection } from '@cngx/core';
import { coerceSignal } from '@cngx/core/utils';
import { cngxDevWarn } from '@cngx/utils';

import { injectHostInteractionBlocked } from '../trigger-guard/host-interaction-blocked';
import {
  CNGX_MENU_DISMISS_HANDLER_FACTORY,
  type CngxMenuDismissPopoverRef,
} from './dismiss-handler';
import { CNGX_MENU_ANNOUNCER_FACTORY } from './menu-announcer';
import { injectMenuConfig } from './menu-config';
import { CNGX_MENU_FOCUS_STACK_FACTORY, connectSubmenuHoverToFocusStack } from './menu-focus-stack';
import type { CngxMenuHost } from './menu-host.token';
import { CNGX_MENU_NAV_STRATEGY } from './menu-nav-strategy';
import { createMenuTriggerLifecycle, isMenuShortcutCombo } from './menu-trigger-lifecycle';

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
 * `cngxMenuButton` / `cngxIconMenuButton` hosts refuse the opening click
 * while blocked and still close an open menu on click.
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
 * Escape to the innermost menu. While a submenu is open, navigation keys
 * are routed to it and do not reach listeners inside the root menu; with
 * no submenu open, ArrowRight / ArrowLeft still reach a consumer
 * `(keydown)` on the menu (a `horizontal` menu excepted, whose own
 * navigation would act on them). Escape at the root, an item activation
 * and every dismissal except a focus-out restore focus to the trigger. The
 * context-menu trigger runs the same model through the shared internal
 * menu-trigger lifecycle.
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

  private readonly lifecycle = createMenuTriggerLifecycle({
    menu: () => this.menu(),
    popover: () => this.popover(),
    hostElement: this.hostElRef.nativeElement,
    menuConfig: this.menuConfig,
    dismissFactory: inject(CNGX_MENU_DISMISS_HANDLER_FACTORY),
    focusStack: this.focusStack,
    direction: this.direction,
    onDismiss: () => this.announcer.announce(this.ariaLabels().menuDismissed),
  });

  /**
   * The dismissal source that closed the menu most recently. `null`
   * before the first close. Surface for demos, telemetry, and audit
   * sinks - reads which path fired without re-installing listeners.
   */
  readonly lastDismissSource = this.lifecycle.lastDismissSource;

  /** A disabled `cngxButton` stays focusable, so keydown still reaches the trigger. */
  private readonly hostGuard = injectHostInteractionBlocked({
    isOpen: () => this.isOpen(),
    close: () => this.popover().hide(),
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.lifecycle.destroy());
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
      untracked(() => (open ? this.lifecycle.open() : this.lifecycle.close()));
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
    if (this.isOpen()) {
      this.lifecycle.routeHostKey(event);
      return;
    }
    if (isMenuShortcutCombo(event) || this.hostGuard.isBlockedNow()) {
      return;
    }
    const key = event.key;
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
    }
  }
}
