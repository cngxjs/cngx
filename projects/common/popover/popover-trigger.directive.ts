import { DOCUMENT } from '@angular/common';
import { computed, Directive, effect, ElementRef, inject, input, untracked } from '@angular/core';

import { SUPPORTS_ANCHOR } from './anchor-positioning';
import { type CngxPopover } from './popover.directive';
import type { PopoverHaspopup } from './popover.types';

/**
 * ARIA wiring atom for elements that trigger a `CngxPopover`.
 *
 * Sets `aria-expanded`, `aria-controls`, and `aria-haspopup` based on the
 * referenced popover's state. Also sets `anchor-name` for CSS Anchor
 * Positioning and registers the anchor element on the popover for fallback
 * positioning.
 *
 * Contains **no event handlers** — the consumer binds interactions directly:
 *
 * ```html
 * <button [cngxPopoverTrigger]="pop" (click)="pop.toggle()">Menu</button>
 * <div cngxPopover #pop="cngxPopover" placement="bottom-start">…</div>
 * ```
 *
 * ### Focus restoration
 * Opt in with `[restoreFocus]="true"` to capture the active element when
 * the popover opens and restore focus to it on close. Useful for menus,
 * confirm panels, and dialogs that steal focus from the trigger.
 *
 * <example-url>http://localhost:4200/#/common/popover/click-popover</example-url>
 * <example-url>http://localhost:4200/#/common/popover/controlled-open</example-url>
 * <example-url>http://localhost:4200/#/common/popover/escape-mode</example-url>
 * <example-url>http://localhost:4200/#/common/popover/placement-variants</example-url>
 */
@Directive({
  selector: '[cngxPopoverTrigger]',
  exportAs: 'cngxPopoverTrigger',
  standalone: true,
  host: {
    '[attr.aria-expanded]': 'popoverRef().isVisible()',
    '[attr.aria-controls]': 'popoverRef().id()',
    '[attr.aria-haspopup]': 'haspopup()',
    '[style.anchor-name]': 'cssAnchorName()',
  },
})
export class CngxPopoverTrigger {
  private readonly elRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly doc = inject(DOCUMENT);

  /** Explicit reference to the popover this trigger controls. */
  readonly popoverRef = input.required<CngxPopover>({
    alias: 'cngxPopoverTrigger',
  });

  /**
   * ARIA haspopup override. When set, wins over the popover-supplied
   * hint (`popoverRef().haspopup()`, populated by composers such as
   * `CngxPopoverPanel`). Final fallback when neither is set is `'true'`.
   * Accepts the W3C-spec values for supported popup-container roles:
   * `'dialog'`, `'listbox'`, `'menu'`, `'tree'`, or `'true'`.
   */
  readonly haspopupInput = input<PopoverHaspopup | undefined>(undefined, {
    alias: 'haspopup',
  });

  /**
   * When `true`, captures `document.activeElement` the moment the
   * popover transitions to a visible state and restores focus to that
   * element when the popover closes. Defaults to `false` so the trigger
   * stays a passive ARIA atom; opt in for menus, confirm panels, and
   * dialogs that move focus away from the trigger.
   */
  readonly restoreFocus = input(false);

  /**
   * Resolved `aria-haspopup`. Consumer override (`haspopup` on the
   * trigger element) wins; otherwise the popover's `haspopup` signal
   * (set by composers like `CngxPopoverPanel`) decides; final fallback
   * is `'true'`.
   */
  protected readonly haspopup = computed(
    () => this.haspopupInput() ?? this.popoverRef().haspopup() ?? 'true',
  );

  protected readonly cssAnchorName = computed(() =>
    SUPPORTS_ANCHOR ? `--cngx-pop-${this.popoverRef().id()}` : null,
  );

  private savedFocus: HTMLElement | null = null;

  constructor() {
    // Register this element as the anchor for fallback positioning.
    effect(() => {
      const pop = this.popoverRef();
      untracked(() => pop.anchorElement.set(this.elRef.nativeElement));
    });

    // Focus restoration: capture on open, restore on close. Inert until
    // `restoreFocus` is opted into.
    effect(() => {
      if (!this.restoreFocus()) {
        return;
      }
      const visible = this.popoverRef().isVisible();
      if (visible) {
        untracked(() => {
          const active = this.doc.activeElement as HTMLElement | null;
          this.savedFocus = active ?? this.elRef.nativeElement;
        });
      } else if (this.savedFocus) {
        const target = this.savedFocus;
        this.savedFocus = null;
        untracked(() => {
          if (typeof target.focus === 'function' && target.isConnected) {
            target.focus();
          }
        });
      }
    });
  }
}
