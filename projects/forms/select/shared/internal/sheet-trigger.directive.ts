import { DestroyRef, Directive, ElementRef, inject, input } from '@angular/core';

import type { CngxSelectSheetTriggerEvents } from './select-sheet-wiring';

/**
 * @internal
 *
 * Forwards the trigger's input events to the sheet wiring. Capture-phase
 * listeners on the trigger element: the trigger's own keydown and focus
 * handlers open the panel synchronously, and the wiring has to know which
 * input caused the open before the sheet picks its initial focus. `focus`
 * does not bubble, but it does capture, so a focus on the trigger input is
 * seen here before the input's own `(focus)` handler runs.
 */
@Directive({
  selector: '[cngxSelectSheetTrigger]',
  standalone: true,
})
export class CngxSelectSheetTrigger {
  readonly events = input.required<CngxSelectSheetTriggerEvents>({
    alias: 'cngxSelectSheetTrigger',
  });

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const onPointerDown = (): void => this.events().handlePointerDown();
    const onKey = (): void => this.events().handleKey();
    const onFocus = (): void => this.events().handleFocus();
    const onFocusOut = (event: FocusEvent): void => {
      const next = event.relatedTarget;
      const leftTrigger = !(next instanceof Node && el.contains(next));
      this.events().handleFocusOut(event, leftTrigger);
    };
    el.addEventListener('pointerdown', onPointerDown, true);
    el.addEventListener('keydown', onKey, true);
    el.addEventListener('input', onKey, true);
    el.addEventListener('focus', onFocus, true);
    el.addEventListener('focusout', onFocusOut, true);
    inject(DestroyRef).onDestroy(() => {
      el.removeEventListener('pointerdown', onPointerDown, true);
      el.removeEventListener('keydown', onKey, true);
      el.removeEventListener('input', onKey, true);
      el.removeEventListener('focus', onFocus, true);
      el.removeEventListener('focusout', onFocusOut, true);
    });
  }
}
