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
  CNGX_MENU_ANNOUNCER_FACTORY,
  CNGX_MENU_DISMISS_HANDLER_FACTORY,
  CNGX_MENU_FOCUS_STACK_FACTORY,
  CNGX_MENU_NAV_STRATEGY,
  connectSubmenuHoverToFocusStack,
  createContextMenuTriggerCore,
  injectMenuConfig,
} from '@cngx/common/interactive';

import type { CngxContextMenuPanel } from './context-menu-panel';

/**
 * Docks a {@link CngxContextMenu} onto a target element. Opens the panel at
 * pointer coordinates on `contextmenu` (right-click) or `Shift+F10`, feeding
 * the panel a per-open datum so one declaration serves many targets.
 *
 * Two ways to obtain the datum `T`:
 * - `[cngxContextMenuData]` - a fixed datum for this single target.
 * - `[cngxContextMenuResolve]` - a resolver run against the `contextmenu`
 *   event, so a container (table, grid, treetable, virtualized list) keeps a
 *   single trigger instance and derives the row from `event.target`. The
 *   resolver wins when both are bound. A `null` resolver result leaves the
 *   native context menu untouched (no `preventDefault`, no open).
 *
 * A thin shell over `createContextMenuTriggerCore` (shared with
 * `CngxContextMenuTrigger`): the core owns the preventDefault decision through
 * its `resolveOpen` seam, so the veto lives in one place and this directive
 * only feeds the resolver.
 *
 * Many triggers may dock the same panel. Each open claims ownership on the
 * panel, so only the opening trigger reports `aria-expanded="true"`, forwards
 * the panel's keydown into its core, and runs its dismiss binding - sibling
 * triggers stay collapsed and inert for opens they did not perform.
 *
 * ```html
 * <tr [cngxContextMenuFor]="menu" [cngxContextMenuData]="row" tabindex="0"></tr>
 * <cngx-context-menu #menu ariaLabel="Row actions">…</cngx-context-menu>
 * ```
 *
 * <example-url>http://localhost:4200/#/ui/context-menu/grid/delegated-resolver</example-url>
 * <example-url>http://localhost:4200/#/ui/context-menu/basic/static-items</example-url>
 * @category ui/context-menu
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/context-menu/context-menu-for.directive.ts
 * @since 0.1.0
 * @relatedTo CngxContextMenu, CngxContextMenuItem, CngxContextMenuTrigger
 */
@Directive({
  selector: '[cngxContextMenuFor]',
  exportAs: 'cngxContextMenuFor',
  standalone: true,
  host: {
    '[attr.aria-haspopup]': '"menu"',
    '[attr.aria-expanded]': 'isOpen()',
    '(contextmenu)': 'handleContextMenu($event)',
    '(keydown)': 'handleKeydown($event)',
  },
})
export class CngxContextMenuFor<T = unknown> {
  /** Panel this trigger opens. Typed to the {@link CngxContextMenuPanel} seam. */
  readonly panel = input.required<CngxContextMenuPanel<T>>({ alias: 'cngxContextMenuFor' });

  /** Fixed datum handed to the panel for this single target. */
  readonly data = input<T | undefined>(undefined, { alias: 'cngxContextMenuData' });

  /**
   * Resolver run against the `contextmenu` event. Return the datum to open
   * with, or `null` to let the native menu show. Wins over `[cngxContextMenuData]`.
   * Keyboard opens (`Shift+F10`) carry no pointer event, so they commit the
   * fixed `[cngxContextMenuData]` datum (or `null`) instead of resolving.
   */
  readonly resolve = input<((event: MouseEvent) => T | null) | undefined>(undefined, {
    alias: 'cngxContextMenuResolve',
  });

  /**
   * `true` while the panel is visible AND this trigger performed the open.
   * N triggers can dock one panel; each reports `aria-expanded` only for its
   * own opens (a shared panel opened by a sibling trigger, `openAsSubmenu`,
   * or a programmatic `popover.show()` leaves this trigger collapsed).
   * Panels without the ownership seam fall back to plain visibility.
   */
  readonly isOpen = computed<boolean>(() => {
    const panel = this.panel();
    if (!panel.popover.isVisible()) {
      return false;
    }
    return panel.openOwner ? panel.openOwner() === this : true;
  });

  private readonly core = createContextMenuTriggerCore({
    menu: () => this.panel().menuHost,
    popover: () => this.panel().popover,
    hostElement: inject<ElementRef<HTMLElement>>(ElementRef).nativeElement,
    document: inject(DOCUMENT),
    menuConfig: injectMenuConfig(),
    dismissFactory: inject(CNGX_MENU_DISMISS_HANDLER_FACTORY),
    announcer: inject(CNGX_MENU_ANNOUNCER_FACTORY)(),
    nav: inject(CNGX_MENU_NAV_STRATEGY),
    direction: injectDirection(),
    focusStackFactory: inject(CNGX_MENU_FOCUS_STACK_FACTORY),
    resolveOpen: (event) => {
      const resolver = this.resolve();
      if (resolver) {
        const resolved = resolver(event);
        return resolved === null ? { open: false } : { open: true, context: resolved };
      }
      return { open: true, context: this.data() ?? null };
    },
    commitContext: (context) => {
      // Runs exactly once per successful open (pointer AND Shift+F10), before
      // the popover shows - the claim must land here (not in an effect) so the
      // handler registration belongs to the opener when N triggers share a panel.
      this.claimPanel();
      this.panel().setContext(context as T | null);
    },
    // Shift+F10 has no MouseEvent for the resolver, so the keyboard open
    // commits the fixed datum (null in resolver-only mode) instead of leaving
    // whatever an earlier right-click stored on the shared panel.
    resolveKeyboardOpen: () => ({ open: true, context: this.data() ?? null }),
  });

  /** Panel-forwarded seams, stable identities so registration is idempotent. */
  private readonly forwardKeydown = (event: KeyboardEvent): void => this.core.handleKeydown(event);
  private readonly forwardActivation = (): void => this.core.openActiveSubmenu();
  private readonly forwardSubmenuNote = (): void => this.core.noteActiveSubmenuOpened();

  /**
   * Claim the shared panel for this trigger's open: record ownership, then
   * register the keydown/activation/submenu-note forwarders. Registration
   * happens on open (not on construction), so the OPENING trigger owns the
   * handlers instead of whichever sibling was constructed last.
   */
  private claimPanel(): void {
    const panel = this.panel();
    panel.claimOpen?.(this);
    panel.setKeydownHandler?.(this.forwardKeydown);
    panel.setActivationHandler?.(this.forwardActivation);
    panel.setSubmenuNoteHandler?.(this.forwardSubmenuNote);
  }

  /**
   * Clear the panel's forwarders and release the claim - but only while this
   * trigger still owns the open (or the panel has no ownership seam). A stale
   * release must never clobber a sibling's newer claim.
   */
  private releasePanel(panel: CngxContextMenuPanel<T>): void {
    if (panel.openOwner && panel.openOwner() !== this) {
      return;
    }
    panel.setKeydownHandler?.(null);
    panel.setActivationHandler?.(null);
    panel.setSubmenuNoteHandler?.(null);
    panel.releaseOpen?.(this);
  }

  constructor() {
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => this.core.destroy());
    effect(() => {
      const open = this.isOpen();
      untracked(() => {
        if (open) {
          this.core.syncOpenState(true);
          return;
        }
        if (this.panel().popover.isVisible()) {
          // Ownership handoff: a sibling trigger claimed the still-visible
          // panel. Stand down without restoring focus - the new owner's menu
          // holds focus and a restore would yank it away.
          this.core.standDown();
        } else {
          this.core.syncOpenState(false);
        }
      });
    });
    // Hover routing: route submenu hover-intent edges through the core's
    // focus stack, same primitives as keyboard/click (see CngxMenuTrigger).
    connectSubmenuHoverToFocusStack({
      focusStack: this.core.focusStack,
      rootMenu: () => this.panel().menuHost,
      rootOpen: () => this.isOpen(),
    });
    // Open moves focus into the panel (a sibling of this trigger), so submenu
    // ArrowRight/ArrowLeft/Escape land on the panel and are forwarded to the
    // core through the handlers claimPanel() registers per open. Release the
    // claim when the popover closes, so the next opener starts clean.
    effect(() => {
      const panel = this.panel();
      if (!panel.popover.isVisible()) {
        untracked(() => this.releasePanel(panel));
      }
    });
    // Release from a swapped-out panel (rebind) and on destroy, so a replaced
    // panel never keeps stale handlers pointing at this trigger's core.
    effect((onCleanup) => {
      const panel = this.panel();
      onCleanup(() => untracked(() => this.releasePanel(panel)));
    });
  }

  protected handleContextMenu(event: MouseEvent): void {
    this.core.handleContextMenu(event);
  }

  protected handleKeydown(event: KeyboardEvent): void {
    this.core.handleKeydown(event);
  }
}
