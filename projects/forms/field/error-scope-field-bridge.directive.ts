import { Directive, inject } from '@angular/core';
import { CNGX_ERROR_SCOPE } from '@cngx/common/interactive';
import { CNGX_FORM_FIELD_REVEAL, type CngxFormFieldRevealContract } from './form-field.token';

/**
 * Bridges an ambient `CngxErrorScope` (from `@cngx/common/interactive`) into
 * the Forms-local {@link CNGX_FORM_FIELD_REVEAL} contract.
 *
 * Wired into {@link CngxFormField} as a `hostDirective` so every form-field
 * automatically picks up the nearest scope without consumer-side wiring. The
 * presenter only ever reads `CNGX_FORM_FIELD_REVEAL`; this directive is the
 * single integration point between `@cngx/forms/field` and the
 * `@cngx/common/interactive` scope token.
 *
 * Without an ancestor scope it passes on a `CNGX_FORM_FIELD_REVEAL` provided
 * above the field (a router- or test-driven trigger); with neither, the
 * form-field falls back to the default error gate
 * (`touched OR errorStrategy(...)`).
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/field/error-scope-field-bridge.directive.ts
 * @since 0.1.0
 * @relatedTo CngxFormField, CngxFormFieldPresenter, CngxErrorScope, CNGX_FORM_FIELD_REVEAL
 */
@Directive({
  selector: '[cngxErrorScopeFieldBridge]',
  standalone: true,
  providers: [
    {
      provide: CNGX_FORM_FIELD_REVEAL,
      useFactory: (): CngxFormFieldRevealContract | null => {
        const scope = inject(CNGX_ERROR_SCOPE, { optional: true });
        if (scope) {
          return { showErrors: scope.showErrors };
        }
        return inject(CNGX_FORM_FIELD_REVEAL, { optional: true, skipSelf: true });
      },
    },
  ],
})
export class CngxErrorScopeFieldBridge {}
