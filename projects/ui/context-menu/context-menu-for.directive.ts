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

import {
  CNGX_MENU_ANNOUNCER_FACTORY,
  CNGX_MENU_DISMISS_HANDLER_FACTORY,
  CNGX_MENU_FOCUS_STACK_FACTORY,
  CNGX_MENU_NAV_STRATEGY,
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
 * ```html
 * <tr [cngxContextMenuFor]="menu" [cngxContextMenuData]="row" tabindex="0"></tr>
 * <cngx-context-menu #menu ariaLabel="Row actions">…</cngx-context-menu>
 * ```
 *
 * @category ui/context-menu
 * @docsKind primary
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
   */
  readonly resolve = input<((event: MouseEvent) => T | null) | undefined>(undefined, {
    alias: 'cngxContextMenuResolve',
  });

  /** Mirrors the panel popover's visibility. */
  readonly isOpen = computed<boolean>(() => this.panel().popover.isVisible());

  private readonly core = createContextMenuTriggerCore({
    menu: () => this.panel().menuHost,
    popover: () => this.panel().popover,
    hostElement: inject<ElementRef<HTMLElement>>(ElementRef).nativeElement,
    document: inject(DOCUMENT),
    menuConfig: injectMenuConfig(),
    dismissFactory: inject(CNGX_MENU_DISMISS_HANDLER_FACTORY),
    announcer: inject(CNGX_MENU_ANNOUNCER_FACTORY)(),
    nav: inject(CNGX_MENU_NAV_STRATEGY),
    focusStackFactory: inject(CNGX_MENU_FOCUS_STACK_FACTORY),
    resolveOpen: (event) => {
      const resolver = this.resolve();
      if (resolver) {
        const resolved = resolver(event);
        return resolved === null ? { open: false } : { open: true, context: resolved };
      }
      return { open: true, context: this.data() ?? null };
    },
    commitContext: (context) => this.panel().setContext(context as T | null),
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.core.destroy());
    effect(() => {
      const open = this.isOpen();
      untracked(() => this.core.syncOpenState(open));
    });
  }

  protected handleContextMenu(event: MouseEvent): void {
    this.core.handleContextMenu(event);
  }

  protected handleKeydown(event: KeyboardEvent): void {
    this.core.handleKeydown(event);
  }
}
