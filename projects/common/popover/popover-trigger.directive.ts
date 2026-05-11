import { computed, Directive, effect, ElementRef, inject, input, untracked } from '@angular/core';

import { SUPPORTS_ANCHOR } from './anchor-positioning';
import { type CngxPopover } from './popover.directive';

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
 * @usageNotes
 *
 * ```html
 * <button [cngxPopoverTrigger]="pop" (click)="pop.toggle()">Menu</button>
 * <div cngxPopover #pop="cngxPopover" placement="bottom-start">…</div>
 * ```
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

  /** Explicit reference to the popover this trigger controls. */
  readonly popoverRef = input.required<CngxPopover>({
    alias: 'cngxPopoverTrigger',
  });

  /**
   * ARIA haspopup value. Adjust to match the popover's role. Accepts
   * the W3C-spec values for all supported popup-container roles:
   * `'dialog'` for dialog popups, `'listbox'` for single/multi select
   * panels, `'menu'` for menu surfaces, `'tree'` for treeview popups
   * (CngxTreeSelect), or `'true'` when the role isn't meaningful.
   */
  readonly haspopup = input<'dialog' | 'listbox' | 'menu' | 'tree' | 'true'>('true');

  protected readonly cssAnchorName = computed(() =>
    SUPPORTS_ANCHOR ? `--cngx-pop-${this.popoverRef().id()}` : null,
  );

  constructor() {
    // Register this element as the anchor for fallback positioning.
    effect(() => {
      const pop = this.popoverRef();
      untracked(() => pop.anchorElement.set(this.elRef.nativeElement));
    });
  }
}
