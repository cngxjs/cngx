import { inject } from '@angular/core';
import { CngxRuntimeError } from '@cngx/utils';

import { CngxFormFieldPresenter } from './form-field-presenter';

/**
 * Inject the surrounding {@link CngxFormFieldPresenter} from a form-field
 * part (label, hint, error, required marker, error list). Throws a
 * `CngxRuntimeError` with code `CNGX2017` when no form field is above it, in
 * development and production alike. `selector` names the part in the
 * development message.
 *
 * `CngxCharCount` in `@cngx/forms/input` throws the same code with the same
 * text itself: this helper is internal to `@cngx/forms/field`, and sharing it
 * would add public API.
 *
 * @internal
 */
export function injectFormFieldPresenter(selector: string): CngxFormFieldPresenter {
  const presenter = inject(CngxFormFieldPresenter, { optional: true });
  if (!presenter) {
    throw new CngxRuntimeError(
      'CNGX2017',
      typeof ngDevMode !== 'undefined' &&
        ngDevMode &&
        `[${selector}] must be placed inside <cngx-form-field> or an element with [cngxFormFieldPresenter].`,
    );
  }
  return presenter;
}
