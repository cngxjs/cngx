import {
  afterNextRender,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  signal,
  untracked,
} from '@angular/core';

import { CNGX_MENU_ANNOUNCER_FACTORY } from './menu-announcer';
import { injectMenuConfig } from './menu-config';
import type { CngxMenuHost } from './menu-host.token';
import { CNGX_MENU_SUBMENU_ITEM, type CngxMenuSubmenuLike } from './menu-submenu.token';

/** See `CngxListboxTrigger` — same structural contract. */
interface PopoverController {
  readonly isVisible: () => boolean;
  show(): void;
  hide(): void;
  readonly anchorElement: { set(el: HTMLElement | null): void };
  /**
   * Popover unique id signal — used to compose the `anchor-name` CSS value
   * the browser's CSS Anchor Positioning expects on the anchor element.
   */
  readonly id: () => string;
  /**
   * Popover host element — the submenu directive attaches hover listeners to
   * it so the submenu stays open while the user mouses over its items.
   */
  readonly elementRef: ElementRef<HTMLElement>;
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
    '[style.anchor-name]': 'cssAnchorName()',
    '(pointerenter)': 'handleParentEnter()',
    '(pointerleave)': 'handleParentLeave()',
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

  /** CSS Anchor Positioning name — matches the popover's `position-anchor`. */
  protected readonly cssAnchorName = computed(() => `--cngx-pop-${this.popover().id()}`);

  get inner(): CngxMenuHost {
    return this.submenuMenu();
  }

  open(): void {
    this.popover().anchorElement.set(this.elementRef.nativeElement as HTMLElement);
    if (!this.popover().isVisible()) {
      this.popover().show();
    }
  }

  close(): void {
    if (this.popover().isVisible()) {
      this.popover().hide();
    }
  }

  // ── Hover-driven open/close lifecycle ────────────────────────────────
  // The submenu opens on parent hover and stays open as long as the pointer
  // is over EITHER the parent menu-item OR the submenu popover. When the
  // pointer leaves both for `submenuCloseDelay` ms, the submenu closes.

  private readonly parentHovered = signal(false);
  private readonly popoverHovered = signal(false);
  private readonly anyHovered = computed(() => this.parentHovered() || this.popoverHovered());

  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  protected handleParentEnter(): void {
    this.parentHovered.set(true);
  }

  protected handleParentLeave(): void {
    this.parentHovered.set(false);
  }

  private cancelCloseTimer(): void {
    if (this.closeTimer !== null) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  private scheduleClose(): void {
    this.cancelCloseTimer();
    const delay = this.menuConfig.submenuCloseDelay;
    if (delay <= 0) {
      this.close();
      return;
    }
    this.closeTimer = setTimeout(() => {
      this.closeTimer = null;
      this.close();
    }, delay);
  }

  private readonly announcer = inject(CNGX_MENU_ANNOUNCER_FACTORY)();
  private readonly menuConfig = injectMenuConfig();
  private readonly destroyRef = inject(DestroyRef);

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

    effect(() => {
      const hovered = this.anyHovered();
      untracked(() => {
        if (hovered) {
          this.cancelCloseTimer();
          this.open();
        } else if (this.popover().isVisible()) {
          this.scheduleClose();
        }
      });
    });

    afterNextRender(() => {
      const popoverEl = this.popover().elementRef.nativeElement;
      const onEnter = (): void => this.popoverHovered.set(true);
      const onLeave = (): void => this.popoverHovered.set(false);
      popoverEl.addEventListener('pointerenter', onEnter);
      popoverEl.addEventListener('pointerleave', onLeave);
      this.destroyRef.onDestroy(() => {
        popoverEl.removeEventListener('pointerenter', onEnter);
        popoverEl.removeEventListener('pointerleave', onLeave);
        this.cancelCloseTimer();
      });
    });
  }
}
