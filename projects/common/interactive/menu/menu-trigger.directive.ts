import { DOCUMENT } from '@angular/common';
import {
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  untracked,
} from '@angular/core';
import { outputToObservable } from '@angular/core/rxjs-interop';
import { injectDirection, resolveInlineArrowKey } from '@cngx/core';

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

/** See `CngxListboxTrigger` - same structural contract. */
interface PopoverController extends CngxMenuDismissPopoverRef {
  show(): void;
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
 * ### Focus model
 *
 * The dropdown trigger deliberately keeps DOM focus on the trigger
 * button while the menu is open - WAI-ARIA APG Menu Button Pattern -
 * and drives the menu's `CngxActiveDescendant` from there via host
 * keydown. It does NOT call {@link CngxMenuHost.focus} after open;
 * that path is reserved for {@link CngxContextMenuTrigger}, where the
 * trigger zone is non-focusable consumer content and the menu
 * container itself must take focus to receive keyboard input.
 *
 * ### Dismissal
 *
 * Four dismissal sources close the menu by default: `Escape`, `pointerdown`
 * outside both the popover and the trigger host, window `blur`, and
 * document `pointercancel`. Window `scroll` is opt-in via
 * {@link withDismissOnScroll}. The source that fired most recently is
 * readable through {@link lastDismissSource}.
 *
 * Override individual sources at app root with `withDismissOnOutsideClick`,
 * `withDismissOnScroll`, `withDismissOnBlur`, or swap the whole handler via
 * {@link CNGX_MENU_DISMISS_HANDLER_FACTORY} for telemetry-wrapped or
 * test-doubled dismissal.
 *
 * @category common/interactive/menu
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/menu/menu-trigger.directive.ts
 * @since 0.1.0
 * @relatedTo CngxMenu, CngxContextMenuTrigger, CngxMenuItemSubmenu, CngxPopoverTrigger
 * <example-url>http://localhost:4200/#/common/interactive/menu/submenu/two-level-submenu</example-url>
 * <example-url>http://localhost:4200/#/common/interactive/menu/trigger/dropdown-menu</example-url>
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

  private readonly doc = inject(DOCUMENT);
  private readonly direction = injectDirection();
  private readonly hostElRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly menuConfig = injectMenuConfig();
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
    onDismiss: () => this.announcer.announce(this.menuConfig.ariaLabels.menuDismissed),
  });

  /**
   * The dismissal source that closed the menu most recently. `null`
   * before the first close. Surface for demos, telemetry, and audit
   * sinks - reads which path fired without re-installing listeners.
   */
  readonly lastDismissSource = this.dismissBinding.lastSource;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.dismissBinding.detach());
    effect(() => {
      const open = this.isOpen();
      untracked(() => {
        if (open) {
          this.focusStack.captureFocus();
          this.dismissBinding.attach();
        } else {
          this.dismissBinding.detach();
          // Clear any open submenu chain so a non-Escape dismissal never leaves
          // a stale submenu on the stack for the next open (mirrors the
          // context-menu trigger core).
          this.focusStack.reset();
          this.focusStack.restoreFocus();
        }
      });
    });
    // Click on a submenu-parent item routes through the menu's `activated`
    // output (CngxMenuItem funnels click into `activateCurrent`), so open the
    // parent's submenu off that deterministic event rather than the keydown
    // path. Enter/Space already open it via `handleActivation`; both funnel to
    // the idempotent `openSubmenuFor`, so the parent never double-opens.
    effect((onCleanup) => {
      const menu = this.menu();
      const sub = outputToObservable(menu.ad.activated).subscribe(() => this.openActiveSubmenu());
      onCleanup(() => sub.unsubscribe());
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
  }

  private openActiveSubmenu(): void {
    const submenu = this.focusStack.activeSubmenu();
    if (submenu) {
      this.focusStack.openSubmenuFor(submenu);
    }
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

    const menu = this.focusStack.effectiveMenu();
    const ad = menu.ad;

    // Resolve the physical arrow to its inline-logical intent: under `rtl`
    // physical ArrowLeft opens the submenu and physical ArrowRight pops it.
    // Vertical / Home / End / activation keys pass through unchanged.
    switch (resolveInlineArrowKey(key, this.direction())) {
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
