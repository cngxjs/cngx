import {
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  type Signal,
} from '@angular/core';
import { CngxPopoverSheet } from '@cngx/common/popover';
import { nextUid } from '@cngx/core/utils';

/**
 * @internal
 *
 * Offers the sheet header input as the sheet's initial focus while the bound
 * condition holds. The condition is a signal, not a boolean: the keydown that
 * opens the panel and the sheet's focus choice run before change detection,
 * so a bound value would be one open behind. The registration lives as long
 * as the element, so an input that leaves the view also leaves the registry.
 */
@Directive({
  selector: '[cngxSelectSheetSearchFocus]',
  standalone: true,
})
export class CngxSelectSheetSearchFocus {
  readonly leads = input.required<Signal<boolean>>({ alias: 'cngxSelectSheetSearchFocus' });

  constructor() {
    const registry = inject(CngxPopoverSheet).initialFocusRegistry;
    const key = nextUid('cngx-select-sheet-search-focus');
    const handle = {
      element: inject<ElementRef<HTMLElement>>(ElementRef).nativeElement,
      enabled: computed(() => this.leads()()),
    };
    registry.register(key, handle);
    inject(DestroyRef).onDestroy(() => registry.unregister(key, handle));
  }
}
