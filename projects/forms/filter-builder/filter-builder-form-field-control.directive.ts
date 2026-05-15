import { Directive, ElementRef, inject } from '@angular/core';
import { CNGX_FORM_FIELD_CONTROL } from '@cngx/forms/field';

import { CngxFilterBuilderPresenter } from './filter-builder-presenter.directive';

/**
 * Opt-in directive that exposes `CngxFilterBuilderPresenter` as the
 * `CngxFormFieldControl` of the current element and owns the
 * `(focusin)` / `(focusout)` host bindings that drive the presenter's
 * `focused` signal. Apply on `<cngx-filter-builder>` when wrapped in
 * `<cngx-form-field>`:
 *
 * ```html
 * <cngx-form-field>
 *   <cngx-filter-builder
 *     cngxFilterBuilderFormFieldControl
 *     [fields]="fields"
 *     [(value)]="value"
 *   ></cngx-filter-builder>
 * </cngx-form-field>
 * ```
 *
 * Listeners stay on this directive (not on the presenter) so consumers
 * without the form-field bridge pay no event-listener cost.
 */
@Directive({
  selector: '[cngxFilterBuilderFormFieldControl]',
  standalone: true,
  providers: [
    { provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxFilterBuilderPresenter },
  ],
  host: {
    '(focusin)': 'handleFocusIn()',
    '(focusout)': 'handleFocusOut($event)',
  },
})
export class CngxFilterBuilderFormFieldControl {
  private readonly presenter = inject(CngxFilterBuilderPresenter);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  protected handleFocusIn(): void {
    this.presenter.setFocused(true);
  }

  protected handleFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (next instanceof Node && this.elementRef.nativeElement.contains(next)) {
      // Focus moved between descendants of the form-field-control host —
      // the builder still owns focus, do not flip the signal.
      return;
    }
    this.presenter.setFocused(false);
  }
}
