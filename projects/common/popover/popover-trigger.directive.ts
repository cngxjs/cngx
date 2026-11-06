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

import { SUPPORTS_ANCHOR } from './anchor-positioning';
import { type CngxPopover } from './popover.directive';
import type { PopoverHaspopup } from './popover.types';

/**
 * ARIA wiring atom for elements that trigger a `CngxPopover`.
 *
 * Sets `aria-expanded`, `aria-controls`, and `aria-haspopup` based on the
 * referenced popover's state. Also sets `anchor-name` for CSS Anchor
 * Positioning and registers the anchor element on the popover for fallback
 * positioning. Both geometry jobs take effect only while no `CngxPopoverAnchor`
 * holds the popover: when the focusable trigger is not the visible box the
 * panel should hang under, put `[cngxPopoverAnchor]` on that box and the
 * trigger yields its `anchor-name` while keeping every ARIA attribute.
 *
 * Contains **no event handlers** - the consumer binds interactions directly:
 *
 * ```html
 * <button [cngxPopoverTrigger]="pop" (click)="pop.toggle()">Menu</button>
 * <div cngxPopover #pop="cngxPopover" placement="bottom-start">…</div>
 * ```
 *
 * ### Focus restoration
 * On close, the trigger can return focus to the element that was focused
 * before the popover opened (the popover snapshots it synchronously in
 * `show()`, so content autofocus cannot displace the restore target). The
 * decision resolves in this order: the `[restoreFocus]` input, then the
 * composer claim on the popover (`CngxPopoverPanel` claims `true`, a menu
 * trigger claims `false` because its focus stack restores), then `false`.
 * A bare popover therefore stays opt-in.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/popover/popover-trigger.directive.ts
 * @since 0.1.0
 * @relatedTo CngxPopover, CngxPopoverAnchor, CngxPopoverPanel, CngxTooltip, CngxMenuButton, CngxDisclosure
 * <example-url>/#/common/popover/click-popover</example-url>
 * <example-url>/#/common/popover/disclosure/link-list</example-url>
 * <example-url>/#/common/popover/controlled-open</example-url>
 * <example-url>/#/common/popover/escape-mode</example-url>
 * <example-url>/#/common/popover/placement-variants</example-url>
 * <example-url>/#/common/popover/anchor/field-box-anchor</example-url>
 * <example-url>/#/common/menu-button/menu-button/basic</example-url>
 */
@Directive({
  selector: '[cngxPopoverTrigger]',
  exportAs: 'cngxPopoverTrigger',
  standalone: true,
  host: {
    '[attr.aria-expanded]': 'popoverRef().isVisible()',
    '[attr.aria-controls]': 'controls()',
    '[attr.aria-haspopup]': 'haspopup()',
    '[style.anchor-name]': 'cssAnchorName()',
  },
})
export class CngxPopoverTrigger {
  private readonly elRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
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
   *
   * Pass `'none'` to emit no `aria-haspopup` at all - correct for a
   * disclosure whose popup is not one of the recognised widget types
   * (e.g. a list of links), where `aria-expanded` alone describes the
   * trigger. `'none'` wins over the composer hint, so it also cancels a
   * `CngxPopoverPanel`'s `'dialog'` default.
   */
  readonly haspopupInput = input<PopoverHaspopup | 'none' | undefined>(undefined, {
    alias: 'haspopup',
  });

  /**
   * ARIA controls override. When set, `aria-controls` names this id instead
   * of the popover element - correct when the popup role sits on an element
   * inside the popover (a `role="listbox"` or `role="tree"` panel). `null`
   * or unset falls back to the popover's `controlsHint()` (installed by a
   * composer such as a menu trigger), then to `popoverRef().id()`.
   */
  readonly controlsInput = input<string | null | undefined>(undefined, {
    alias: 'controls',
  });

  /**
   * When `true`, remembers the popover's pre-open focus target (the
   * popover snapshots `document.activeElement` synchronously inside
   * `show()`, before content autofocus can land in the panel) and
   * restores focus to it when the popover closes. A snapshot of `body`
   * (a browser that does not focus a clicked button, such as Safari)
   * falls back to this trigger. The restore runs only when focus is
   * lost at close time - on `body` or inside the panel - so a close
   * caused by a click or Escape in another control leaves focus there.
   * Unbound, the popover's composer claim decides
   * (`popoverRef().restoreFocusHint()`: `CngxPopoverPanel` claims `true`, a
   * menu trigger `false`), and without a claim it stays `false`, so a bare
   * popover trigger is a passive ARIA atom. Bind `true` or `false` to
   * override the composer.
   */
  readonly restoreFocusInput = input<boolean | undefined>(undefined, { alias: 'restoreFocus' });

  /**
   * @internal Resolved focus return: the `[restoreFocus]` input, then the
   * popover's composer claim, then `false`.
   */
  protected readonly restoreFocus = computed(
    () => this.restoreFocusInput() ?? this.popoverRef().restoreFocusHint() ?? false,
  );

  /**
   * Resolved `aria-haspopup`. Consumer override (`haspopup` on the
   * trigger element) wins; otherwise the popover's `haspopup` signal
   * (set by composers like `CngxPopoverPanel`) decides; final fallback
   * is `'true'`. The `'none'` sentinel resolves to `null` so the host
   * binding drops the attribute entirely.
   */
  protected readonly haspopup = computed<PopoverHaspopup | null>(() => {
    const resolved = this.haspopupInput() ?? this.popoverRef().haspopup() ?? 'true';
    return resolved === 'none' ? null : resolved;
  });

  /**
   * Resolved `aria-controls`: the consumer override, else the popover's
   * composer hint, else the popover id.
   */
  protected readonly controls = computed<string>(
    () => this.controlsInput() ?? this.popoverRef().controlsHint() ?? this.popoverRef().id(),
  );

  /**
   * CSS anchor name, yielded (`null`) while a `CngxPopoverAnchor` holds
   * the popover's explicit anchor slot.
   */
  protected readonly cssAnchorName = computed(() =>
    SUPPORTS_ANCHOR && this.popoverRef().explicitAnchorElement() === null
      ? `--cngx-pop-${this.popoverRef().id()}`
      : null,
  );

  private savedFocus: HTMLElement | null = null;

  constructor() {
    // Register this element as the anchor for fallback positioning.
    effect(() => {
      const pop = this.popoverRef();
      untracked(() => pop.setAnchorElement(this.elRef.nativeElement));
    });

    // Release the implicit anchor slot on destroy. The popover guards on
    // identity, so a trigger that registered later is not clobbered.
    this.destroyRef.onDestroy(() => {
      this.popoverRef().releaseAnchorElement(this.elRef.nativeElement);
    });

    // Focus restoration: adopt the popover's pre-show focus snapshot on
    // open, restore on close. Inert while the resolved `restoreFocus` is false.
    effect(() => {
      if (!this.restoreFocus()) {
        return;
      }
      const visible = this.popoverRef().isVisible();
      if (visible) {
        untracked(() => {
          const origin = this.popoverRef().focusOrigin();
          this.savedFocus = origin && origin !== this.doc.body ? origin : this.elRef.nativeElement;
        });
      } else if (this.savedFocus) {
        const target = this.savedFocus;
        this.savedFocus = null;
        untracked(() => {
          if (!this.isFocusLost()) {
            return;
          }
          if (typeof target.focus === 'function' && target.isConnected) {
            target.focus();
          }
        });
      }
    });
  }

  // Same rule as CngxPopoverSheet: `body` counts as lost because the
  // popover blurs a focused descendant on hide.
  private isFocusLost(): boolean {
    const active = this.doc.activeElement;
    return (
      !active ||
      active === this.doc.body ||
      this.popoverRef().elementRef.nativeElement.contains(active)
    );
  }
}
