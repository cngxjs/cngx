import { DOCUMENT } from '@angular/common';
import {
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
} from '@angular/core';

import type { CngxMenuHost } from './menu-host.token';

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
}

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
 * Anchoring uses a transient zero-size DOM element positioned at the
 * pointer coords, set on the popover's `anchorElement` signal — see
 * `menu-accepted-debt.md` §1 for the rationale (virtual `getBoundingClientRect`
 * objects are not yet supported as anchors).
 *
 * Touch-driven opening via long-press is deliberately out of scope for the
 * initial commit; consumers can compose `CngxLongPress` against the same
 * popover anchor pattern as a follow-up.
 *
 * @category interactive
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
  readonly popover = input.required<PopoverController>();

  /** Mirrors `popover.isVisible()`. */
  readonly isOpen = computed<boolean>(() => this.popover().isVisible());

  private readonly doc = inject(DOCUMENT);
  private readonly hostElRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private virtualAnchor: HTMLElement | null = null;
  private savedFocus: HTMLElement | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.removeVirtualAnchor());
  }

  protected handleContextMenu(event: MouseEvent): void {
    event.preventDefault();
    this.openAt(event.clientX, event.clientY);
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'F10' && event.shiftKey) {
      event.preventDefault();
      const rect = this.hostElRef.nativeElement.getBoundingClientRect();
      this.openAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return;
    }
    if (event.key === 'Escape' && this.isOpen()) {
      event.preventDefault();
      this.popover().hide();
      this.restoreFocus();
    }
  }

  private openAt(x: number, y: number): void {
    this.captureFocus();
    const anchor = this.ensureVirtualAnchor();
    anchor.style.left = `${x}px`;
    anchor.style.top = `${y}px`;
    anchor.style.setProperty('anchor-name', `--cngx-pop-${this.popover().id()}`);
    this.popover().anchorElement.set(anchor);
    if (!this.popover().isVisible()) {
      this.popover().show();
    }
    this.menu().ad.highlightFirst();
  }

  private captureFocus(): void {
    const active = this.doc.activeElement;
    this.savedFocus = active instanceof HTMLElement ? active : null;
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

  private ensureVirtualAnchor(): HTMLElement {
    if (this.virtualAnchor) {
      return this.virtualAnchor;
    }
    const el = this.doc.createElement('div');
    el.setAttribute('aria-hidden', 'true');
    el.className = 'cngx-context-menu-anchor';
    el.style.cssText = 'position:fixed;width:0;height:0;pointer-events:none';
    this.doc.body.appendChild(el);
    this.virtualAnchor = el;
    return el;
  }

  private removeVirtualAnchor(): void {
    this.virtualAnchor?.remove();
    this.virtualAnchor = null;
  }
}
