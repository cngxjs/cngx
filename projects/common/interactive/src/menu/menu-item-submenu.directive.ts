import {
  computed,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  untracked,
} from '@angular/core';

import { CngxMenuAnnouncer } from './menu-announcer';
import { injectMenuConfig } from './menu-config';
import type { CngxMenuHost } from './menu-host.token';
import { CNGX_MENU_SUBMENU_ITEM, type CngxMenuSubmenuLike } from './menu-submenu.token';

/** See `CngxListboxTrigger` — same structural contract. */
interface PopoverController {
  readonly isVisible: () => boolean;
  show(): void;
  hide(): void;
}

/**
 * Companion directive applied to a `[cngxMenuItem]` that opens a nested
 * submenu. The directive itself does NOT render `role="menuitem"` — that
 * stays on `CngxMenuItem`. Adds `aria-haspopup="menu"` and reactive
 * `aria-expanded`, registers itself with the surrounding menu as a
 * submenu source so the menu trigger can drive arrow-right / arrow-left
 * focus-stack semantics.
 *
 * Two inputs:
 * - `cngxMenuItemSubmenu`: the popover wrapping the submenu.
 * - `submenuMenu`: the inner `CngxMenu` (or any `CngxMenuHost`) the
 *   trigger transfers focus to when the submenu opens.
 *
 * The submenu's `<div cngxPopover>` MUST set `[exclusive]="false"` so that
 * opening it does not light-dismiss the parent popover. This is the only
 * extra wiring the consumer needs beyond the two inputs.
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxMenuItemSubmenu]',
  exportAs: 'cngxMenuItemSubmenu',
  standalone: true,
  providers: [{ provide: CNGX_MENU_SUBMENU_ITEM, useExisting: CngxMenuItemSubmenu }],
  host: {
    '[attr.aria-haspopup]': '"menu"',
    '[attr.aria-expanded]': 'isOpen()',
  },
})
export class CngxMenuItemSubmenu implements CngxMenuSubmenuLike {
  /** Popover wrapping the submenu. Required. */
  readonly popover = input.required<PopoverController>({ alias: 'cngxMenuItemSubmenu' });

  /** Inner `CngxMenuHost` (the submenu's own `CngxMenu`). Required. */
  readonly submenuMenu = input.required<CngxMenuHost>();

  private readonly elementRef = inject(ElementRef<HTMLElement>);

  /** Mirrors the host element id set by the sibling `CngxMenuItem`. */
  get id(): string {
    return (this.elementRef.nativeElement as HTMLElement).id;
  }

  readonly isOpen = computed<boolean>(() => this.popover().isVisible());

  get inner(): CngxMenuHost {
    return this.submenuMenu();
  }

  open(): void {
    if (!this.popover().isVisible()) {
      this.popover().show();
    }
  }

  close(): void {
    if (this.popover().isVisible()) {
      this.popover().hide();
    }
  }

  private readonly announcer = inject(CngxMenuAnnouncer);
  private readonly menuConfig = injectMenuConfig();

  /**
   * Transition tracker for `isOpen`. `linkedSignal` carries an explicit
   * structural `equal` so the effect below only fires on a real
   * boolean transition, not on every parent re-eval.
   */
  private readonly transition = linkedSignal<
    boolean,
    { current: boolean; previous: boolean }
  >({
    source: this.isOpen,
    computation: (current, prev) => ({
      current,
      previous: prev?.value.current ?? false,
    }),
    equal: (a, b) => a.current === b.current && a.previous === b.previous,
  });

  constructor() {
    effect(() => {
      const { current, previous } = this.transition();
      if (current === previous) {
        return;
      }
      untracked(() => {
        if (current) {
          this.announcer.announce(this.menuConfig.ariaLabels.submenuOpened);
        } else {
          this.announcer.announce(this.menuConfig.ariaLabels.submenuClosed);
        }
      });
    });
  }
}
