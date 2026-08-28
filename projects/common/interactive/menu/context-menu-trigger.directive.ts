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
import { injectDirection } from '@cngx/core';

import {
  createContextMenuTriggerCore,
  type CngxContextMenuTriggerPopoverRef,
} from './context-menu-trigger-core';
import { CNGX_MENU_DISMISS_HANDLER_FACTORY } from './dismiss-handler';
import { CNGX_MENU_ANNOUNCER_FACTORY } from './menu-announcer';
import { injectMenuConfig } from './menu-config';
import {
  CNGX_MENU_FOCUS_STACK_FACTORY,
  connectSubmenuHoverToFocusStack,
} from './menu-focus-stack';
import type { CngxMenuHost } from './menu-host.token';
import { CNGX_MENU_NAV_STRATEGY } from './menu-nav-strategy';

/**
 * Opens a `CngxMenu`-bearing popover at pointer coordinates in response to
 * `contextmenu` (right-click) or `Shift+F10` (keyboard equivalent).
 *
 * Two inputs:
 * - `cngxContextMenuTrigger`: the `CngxMenu` (or any `CngxMenuHost`) the
 *   popover wraps.
 * - `popover`: the `CngxPopover` panel containing the menu. Must be marked
 *   `[exclusive]="true"` (default) so that opening this menu light-dismisses
 *   any other popover.
 *
 * A thin shell over {@link createContextMenuTriggerCore}: the core owns the
 * `contextmenu` / `Shift+F10` handling, the transient pointer anchor, the
 * dismiss binding, and focus save/restore, so `CngxContextMenuFor`
 * (`@cngx/ui/context-menu`) can reuse the same implementation without
 * inheritance. This directive supplies no `resolveOpen` seam, so it keeps
 * the always-open, always-`preventDefault` behaviour.
 *
 * Anchoring uses a transient zero-size DOM element positioned at the
 * pointer coords, set on the popover's `anchorElement` signal - virtual
 * `getBoundingClientRect` objects are not yet supported as anchors, so
 * the transient div is the workaround.
 *
 * Touch-driven opening via long-press is deliberately out of scope for the
 * initial commit; consumers can compose `CngxLongPress` against the same
 * popover anchor pattern as a follow-up.
 *
 * ### Dismissal
 *
 * Four sources close the menu by default: `Escape`, `pointerdown` outside
 * both the popover and the trigger host, window `blur`, and document
 * `pointercancel`. Window `scroll` is opt-in via
 * {@link withDismissOnScroll}. Touch users get backdrop dismissal through
 * the same `pointerdown` listener - no ESC dependency. The dismissal
 * source that fired most recently is readable through
 * {@link lastDismissSource}.
 *
 * Override individual sources at app root with `withDismissOnOutsideClick`,
 * `withDismissOnScroll`, `withDismissOnBlur`, or swap the whole handler via
 * {@link CNGX_MENU_DISMISS_HANDLER_FACTORY}.
 *
 * @category common/interactive/menu
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/menu/context-menu-trigger.directive.ts
 * @since 0.1.0
 * @relatedTo CngxMenu, CngxMenuTrigger, CngxPopover
 * <example-url>http://localhost:4200/#/common/interactive/context-menu/right-click-target-zone</example-url>
 */
@Directive({
  selector: '[cngxContextMenuTrigger]',
  exportAs: 'cngxContextMenuTrigger',
  standalone: true,
  host: {
    '[attr.aria-haspopup]': '"menu"',
    '[attr.aria-expanded]': 'isOpen()',
    '(contextmenu)': 'handleContextMenu($event)',
    '(keydown)': 'handleKeydown($event)',
  },
})
export class CngxContextMenuTrigger {
  /** Menu controlled by this trigger. */
  readonly menu = input.required<CngxMenuHost>({ alias: 'cngxContextMenuTrigger' });
  /** Popover that wraps the menu panel. */
  readonly popover = input.required<CngxContextMenuTriggerPopoverRef>();

  /** Mirrors `popover.isVisible()`. */
  readonly isOpen = computed<boolean>(() => this.popover().isVisible());

  private readonly core = createContextMenuTriggerCore({
    menu: () => this.menu(),
    popover: () => this.popover(),
    hostElement: inject<ElementRef<HTMLElement>>(ElementRef).nativeElement,
    document: inject(DOCUMENT),
    menuConfig: injectMenuConfig(),
    dismissFactory: inject(CNGX_MENU_DISMISS_HANDLER_FACTORY),
    announcer: inject(CNGX_MENU_ANNOUNCER_FACTORY)(),
    nav: inject(CNGX_MENU_NAV_STRATEGY),
    direction: injectDirection(),
    focusStackFactory: inject(CNGX_MENU_FOCUS_STACK_FACTORY),
  });

  /**
   * The dismissal source that closed the menu most recently. `null`
   * before the first close. Surface for demos, telemetry, and audit
   * sinks - reads which path fired without re-installing listeners.
   */
  readonly lastDismissSource = this.core.lastDismissSource;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.core.destroy());
    effect(() => {
      const open = this.isOpen();
      untracked(() => this.core.syncOpenState(open));
    });
    // Hover routing: route submenu hover-intent edges through the core's
    // focus stack, same primitives as keyboard/click (see CngxMenuTrigger).
    connectSubmenuHoverToFocusStack({
      focusStack: this.core.focusStack,
      rootMenu: () => this.menu(),
    });
  }

  protected handleContextMenu(event: MouseEvent): void {
    this.core.handleContextMenu(event);
  }

  protected handleKeydown(event: KeyboardEvent): void {
    this.core.handleKeydown(event);
  }
}
