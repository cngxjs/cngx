import { Directive, ElementRef, inject } from '@angular/core';
import { CNGX_FORM_FIELD_CONTROL } from '@cngx/forms/field';
import { CNGX_SELECT_DISABLE_FIELD_SYNC } from '@cngx/forms/select';

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
 *
 * @category forms/filter-builder
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/filter-builder/filter-builder-form-field-control.directive.ts
 * @since 0.1.0
 * @relatedTo CngxFilterBuilder, CngxFilterBuilderPresenter
 */
@Directive({
  selector: '[cngxFilterBuilderFormFieldControl]',
  standalone: true,
  providers: [
    { provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxFilterBuilderPresenter },
    // The builder is the form-field's control; its descendant <cngx-select>s
    // must not sync the FilterGroup object into their own scalar value (#98).
    { provide: CNGX_SELECT_DISABLE_FIELD_SYNC, useValue: true },
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
      // Focus moved between descendants of the form-field-control host -
      // the builder still owns focus, do not flip the signal.
      return;
    }
    this.presenter.setFocused(false);
  }
}
