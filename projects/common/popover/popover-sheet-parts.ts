import { computed, DestroyRef, Directive, ElementRef, inject, input, signal } from '@angular/core';
import { CngxSwipeDismiss } from '@cngx/common/interactive';
import { nextUid } from '@cngx/core/utils';

import {
  type CngxPopoverSheetFocusHandle,
  type CngxPopoverSheetTitleHandle,
  injectPopoverSheetHost,
} from './popover-sheet-host';

// Header and handle share the swipe wiring: a CngxSwipeDismiss on the same
// element closes the sheet through closeRequested (CngxBottomSheet precedent).
function routeSwipeToSheet(part: string): void {
  const sheet = injectPopoverSheetHost(part);
  const swipe = inject(CngxSwipeDismiss, { self: true, optional: true });
  if (!swipe) {
    return;
  }
  const sub = swipe.swiped.subscribe(() => sheet.requestClose('swipe'));
  inject(DestroyRef).onDestroy(() => sub.unsubscribe());
}

/**
 * Header row of a `CngxPopoverSheet`. Stays put while the content below it
 * scrolls; add `cngxSwipeDismiss="down"` to close the sheet by swiping it.
 *
 * @category common/popover
 * @since 0.1.0
 * @relatedTo CngxPopoverSheet, CngxSwipeDismiss
 */
@Directive({
  selector: '[cngxPopoverSheetHeader]',
  standalone: true,
  host: { class: 'cngx-popover-sheet-header' },
})
export class CngxPopoverSheetHeader {
  constructor() {
    routeSwipeToSheet('cngxPopoverSheetHeader');
  }
}

/**
 * The element that names a modal `CngxPopoverSheet`. The sheet points its
 * `aria-labelledby` here, never at the header that also holds buttons.
 *
 * @category common/popover
 * @since 0.1.0
 * @relatedTo CngxPopoverSheet
 */
@Directive({
  selector: '[cngxPopoverSheetTitle]',
  standalone: true,
  host: { '[id]': 'id()' },
})
export class CngxPopoverSheetTitle implements CngxPopoverSheetTitleHandle {
  /** Generated id the sheet references. */
  readonly id = signal(nextUid('cngx-popover-sheet-title')).asReadonly();

  constructor() {
    const sheet = injectPopoverSheetHost('cngxPopoverSheetTitle');
    sheet.titleRegistry.register(this);
    inject(DestroyRef).onDestroy(() => sheet.titleRegistry.unregister(this));
  }
}

/**
 * Decorative drag handle. Always `aria-hidden`: screen-reader users close
 * the sheet through its close control, since their swipe is consumed by
 * navigation.
 *
 * @category common/popover
 * @since 0.1.0
 * @relatedTo CngxPopoverSheet
 */
@Directive({
  selector: '[cngxPopoverSheetHandle]',
  standalone: true,
  host: { class: 'cngx-popover-sheet-handle', 'aria-hidden': 'true' },
})
export class CngxPopoverSheetHandle {
  constructor() {
    routeSwipeToSheet('cngxPopoverSheetHandle');
  }
}

/**
 * Marks the element that receives focus when a modal `CngxPopoverSheet`
 * opens, e.g. the search input of a fullscreen panel. Without one the first
 * tabbable element is focused.
 *
 * A panel can mark several elements. The first enabled one in document order
 * takes focus, so a search field that should lead only some opens binds
 * `[cngxPopoverSheetInitialFocus]="condition"` and the list below it carries
 * the bare attribute as the default target. The condition is read when the
 * sheet opens.
 *
 * @category common/popover
 * @since 0.1.0
 * @relatedTo CngxPopoverSheet
 */
@Directive({
  selector: '[cngxPopoverSheetInitialFocus]',
  standalone: true,
})
export class CngxPopoverSheetInitialFocus implements CngxPopoverSheetFocusHandle {
  /** The element focused on open. */
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /**
   * `false` keeps this element out of the next open's focus choice. The bare
   * attribute, or no binding, leaves it enabled.
   */
  readonly enabledInput = input<boolean | undefined, boolean | '' | undefined>(undefined, {
    alias: 'cngxPopoverSheetInitialFocus',
    transform: (v) => (typeof v === 'string' ? undefined : v),
  });

  /** @internal Read by the sheet on open. */
  readonly enabled = computed(() => this.enabledInput() !== false);

  private readonly key = nextUid('cngx-popover-sheet-initial-focus');

  constructor() {
    const sheet = injectPopoverSheetHost('cngxPopoverSheetInitialFocus');
    sheet.initialFocusRegistry.register(this.key, this);
    inject(DestroyRef).onDestroy(() => sheet.initialFocusRegistry.unregister(this.key, this));
  }
}
