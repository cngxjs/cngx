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
  CNGX_MENU_DISMISS_HANDLER_FACTORY,
  createMenuTriggerDismissBinding,
  type CngxMenuDismissPopoverRef,
} from './dismiss-handler';
import { CNGX_MENU_ANNOUNCER_FACTORY } from './menu-announcer';
import { injectMenuConfig } from './menu-config';
import type { CngxMenuHost } from './menu-host.token';

/** See `CngxListboxTrigger` - same structural contract. */
interface PopoverController extends CngxMenuDismissPopoverRef {
  show(): void;
  readonly anchorElement: { set(el: HTMLElement | null): void };
  /**
   * Popover unique id signal - used to compose the `anchor-name` CSS value
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
  readonly popover = input.required<PopoverController>();

  /** Mirrors `popover.isVisible()`. */
  readonly isOpen = computed<boolean>(() => this.popover().isVisible());

  private readonly doc = inject(DOCUMENT);
  private readonly hostElRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly menuConfig = injectMenuConfig();
  private readonly announcer = inject(CNGX_MENU_ANNOUNCER_FACTORY)();
  private readonly dismissBinding = createMenuTriggerDismissBinding({
    popover: () => this.popover(),
    hostElement: this.hostElRef.nativeElement,
    menuConfig: this.menuConfig,
    factory: inject(CNGX_MENU_DISMISS_HANDLER_FACTORY),
    onDismiss: () => this.announcer.announce(this.menuConfig.ariaLabels.menuDismissed),
  });
  private virtualAnchor: HTMLElement | null = null;
  private savedFocus: HTMLElement | null = null;

  /**
   * The dismissal source that closed the menu most recently. `null`
   * before the first close. Surface for demos, telemetry, and audit
   * sinks - reads which path fired without re-installing listeners.
   */
  readonly lastDismissSource = this.dismissBinding.lastSource;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.removeVirtualAnchor();
      this.dismissBinding.detach();
    });
    effect(() => {
      const open = this.isOpen();
      untracked(() => {
        if (open) {
          if (this.savedFocus === null) {
            const active = this.doc.activeElement;
            this.savedFocus = active instanceof HTMLElement ? active : null;
          }
          this.dismissBinding.attach();
        } else {
          this.dismissBinding.detach();
          if (this.savedFocus !== null) {
            this.restoreFocus();
          }
        }
      });
    });
  }

  protected handleContextMenu(event: MouseEvent): void {
    event.preventDefault();
    this.openAt(event.clientX, event.clientY);
  }

  protected handleKeydown(event: KeyboardEvent): void {
    // Escape is owned by CngxPopover's global listener; focus has moved
    // into the menu container by the time the user can press it.
    if (event.key === 'F10' && event.shiftKey) {
      event.preventDefault();
      const rect = this.hostElRef.nativeElement.getBoundingClientRect();
      this.openAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
  }

  private openAt(x: number, y: number): void {
    // Capture savedFocus eagerly BEFORE show(): the effect-driven capture
    // races the queueMicrotask focus transfer below in real browsers and
    // ends up storing the menu UL instead of the pre-open target. The
    // effect still runs (it also attaches the dismiss binding) but the
    // `savedFocus === null` guard keeps this earlier capture.
    if (this.savedFocus === null) {
      const active = this.doc.activeElement;
      this.savedFocus = active instanceof HTMLElement ? active : null;
    }
    const anchor = this.ensureVirtualAnchor();
    anchor.style.left = `${x}px`;
    anchor.style.top = `${y}px`;
    anchor.style.setProperty('anchor-name', `--cngx-pop-${this.popover().id()}`);
    this.popover().anchorElement.set(anchor);
    if (!this.popover().isVisible()) {
      this.popover().show();
    }
    this.menu().ad.highlightFirst();
    // Defer one microtask so showPopover()'s top-layer DOM mutation
    // settles before focus moves into the menu container - matches the
    // existing close-time `restoreFocus` pattern below.
    queueMicrotask(() => this.menu().focus());
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
