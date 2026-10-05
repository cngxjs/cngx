import { computed, Directive, effect, ElementRef, inject, input, untracked } from '@angular/core';

import { SUPPORTS_ANCHOR } from './anchor-positioning';
import { type CngxPopover } from './popover.directive';

/**
 * Geometry anchor atom: positions a `CngxPopover` against its host
 * element instead of against the popover's trigger.
 *
 * Reach for it when the focusable trigger is not the visible box the
 * panel should hang under - an `<input>` inside a bordered field row, an
 * icon button inside a toolbar segment. The trigger keeps every ARIA
 * attribute (`aria-expanded`, `aria-controls`, `aria-haspopup`); this
 * atom owns only the geometry. It is the cngx counterpart of Material's
 * `matAutocompleteOrigin`.
 *
 * ```html
 * <div class="field" [cngxPopoverAnchor]="pop">
 *   <input [cngxPopoverTrigger]="pop" (focus)="pop.show()" aria-label="City" />
 * </div>
 * <div cngxPopover #pop="cngxPopover" placement="bottom-start">…</div>
 * ```
 *
 * While the atom holds the popover's explicit anchor slot it emits
 * `anchor-name` for CSS Anchor Positioning and is the reference element
 * of the Floating UI fallback, the arrow geometry and the outside-click
 * guard; `CngxPopoverTrigger` yields its own `anchor-name`. The explicit
 * anchor wins over every `setAnchorElement` writer. With two atoms on one
 * popover the last registered wins, and only the holder emits
 * `anchor-name`. On destroy (or when the bound popover changes) the atom
 * releases the slot identity-guarded and the trigger becomes the anchor
 * again.
 *
 * @category common/popover
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/popover/popover-anchor.directive.ts
 * @since 0.1.0
 * @relatedTo CngxPopover, CngxPopoverTrigger
 * <example-url>http://localhost:4200/#/common/popover/anchor/field-box-anchor</example-url>
 */
@Directive({
  selector: '[cngxPopoverAnchor]',
  exportAs: 'cngxPopoverAnchor',
  standalone: true,
  host: {
    '[style.anchor-name]': 'cssAnchorName()',
  },
})
export class CngxPopoverAnchor {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** The popover this element anchors. */
  readonly popoverRef = input.required<CngxPopover>({
    alias: 'cngxPopoverAnchor',
  });

  /** Whether this host currently holds the popover's explicit anchor slot. */
  protected readonly isAnchor = computed(
    () => this.popoverRef().explicitAnchorElement() === this.host,
  );

  protected readonly cssAnchorName = computed(() =>
    SUPPORTS_ANCHOR && this.isAnchor() ? `--cngx-pop-${this.popoverRef().id()}` : null,
  );

  constructor() {
    // Cross-directive registration keyed on the input; onCleanup releases
    // the previous popover on a ref swap and on destroy.
    effect((onCleanup) => {
      const pop = this.popoverRef();
      untracked(() => pop.registerAnchorElement(this.host));
      onCleanup(() => pop.unregisterAnchorElement(this.host));
    });
  }
}
