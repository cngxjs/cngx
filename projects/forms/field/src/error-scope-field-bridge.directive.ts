import { Directive, inject } from '@angular/core';
import { CNGX_ERROR_SCOPE } from '@cngx/common/interactive';
import {
  CNGX_FORM_FIELD_REVEAL,
  type CngxFormFieldRevealContract,
} from './form-field.token';

/**
 * Bridges an ambient {@link `@cngx/common/interactive`#CngxErrorScope} into
 * the Forms-local {@link CNGX_FORM_FIELD_REVEAL} contract.
 *
 * Wired into {@link CngxFormField} as a `hostDirective` so every form-field
 * automatically picks up the nearest scope without consumer-side wiring. The
 * presenter only ever reads `CNGX_FORM_FIELD_REVEAL`; this directive is the
 * single integration point between `@cngx/forms/field` and the
 * `@cngx/common/interactive` scope token.
 *
 * No-op when no ancestor scope is provided — the form-field falls back to
 * the default error gate (`touched OR errorStrategy(...)`).
 *
 * @category directives
 */
@Directive({
  selector: '[cngxErrorScopeFieldBridge]',
  standalone: true,
  providers: [
    {
      provide: CNGX_FORM_FIELD_REVEAL,
      useFactory: (): CngxFormFieldRevealContract | null => {
        const scope = inject(CNGX_ERROR_SCOPE, { optional: true });
        return scope ? { showErrors: scope.showErrors } : null;
      },
    },
  ],
})
export class CngxErrorScopeFieldBridge {}
