import { Directive } from '@angular/core';
import { CngxFormFieldPresenter } from '@cngx/forms/field';

/**
 * Shields a control nested inside another field's affix row from the
 * surrounding `cngx-form-field`. Nulling the presenter for this element keeps
 * the inner select from registering a second `CNGX_FORM_FIELD_CONTROL`, from
 * mirroring the field's ARIA state, and from writing its own value into the
 * field, so the amount input stays the single control of the field.
 */
@Directive({
  selector: '[demoAffixDetach]',
  standalone: true,
  providers: [{ provide: CngxFormFieldPresenter, useValue: null }],
})
export class DemoAffixDetach {}
