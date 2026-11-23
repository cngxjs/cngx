import { computed, Directive, ElementRef, inject, input } from '@angular/core';
import { CNGX_FORM_FIELD_CONTROL } from '@cngx/core/tokens';
import { cngxDevWarn } from '@cngx/utils';
import { CNGX_ERROR_SCOPE } from '../error-scope/error-scope.token';

/**
 * Marks any DOM element as carrying an error state.
 *
 * Generic host-element marker - works on cngx, Material, CDK, native HTML,
 * and third-party hosts. Toggles the `.cngx-error` class hook plus reactive
 * `aria-invalid` / `aria-errormessage` attributes when the bound boolean is
 * true. The directive is purely presentational; it does not own the error
 * state itself, it only reflects it.
 *
 * Inside a `CngxErrorScope` (any `CNGX_ERROR_SCOPE` ancestor) the error is
 * shown only while the scope reveals: before `reveal()` and after `reset()`
 * the host gets no class and `aria-invalid="false"`. Without a scope the
 * bound flag alone decides. `aria-errormessage` references the message id
 * only while the error is shown.
 *
 * The `cngxErrorState` input takes a plain `boolean`. Consumers binding a
 * signal write `[cngxErrorState]="form.email().invalid()"` - the signal is
 * invoked at the binding site (canonical Angular pattern), not detected at
 * runtime.
 *
 * ```html
 * <input
 *   [cngxErrorState]="emailField().invalid()"
 *   cngxErrorMessageId="email-error"
 * />
 * <span id="email-error" role="alert">Please enter a valid email.</span>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/error-state/error-state.directive.ts
 * @since 0.1.0
 * @relatedTo CngxErrorAggregator, CngxErrorSource, CngxErrorScope
 * <example-url>/#/common/interactive/error/state/basic-boolean-flag-flips-aria-invalid-aria-errormessage</example-url>
 * <example-url>/#/common/interactive/error/state/without-message-id-class-hook-aria-invalid-only</example-url>
 * @axis level atom
 */
@Directive({
  selector: '[cngxErrorState]',
  standalone: true,
  exportAs: 'cngxErrorState',
  host: {
    '[class.cngx-error]': 'shown()',
    '[attr.aria-invalid]': 'ariaInvalid()',
    '[attr.aria-errormessage]': 'ariaErrorMessage()',
  },
})
export class CngxErrorState {
  /**
   * Required error flag. While `true` (and the ancestor scope, if any, reveals)
   * the host gets the `cngx-error` class and `aria-invalid="true"`; otherwise it
   * gets `aria-invalid="false"` and no class.
   */
  readonly cngxErrorState = input.required<boolean>();

  /** Optional id of the element rendering the error message text. */
  readonly cngxErrorMessageId = input<string | null>(null);

  private readonly scope = inject(CNGX_ERROR_SCOPE, { optional: true });

  /** @internal - the flag gated on the ancestor scope's `showErrors`. */
  protected readonly shown = computed(
    () => this.cngxErrorState() && (this.scope?.showErrors() ?? true),
  );

  /** @internal - explicit boolean, always present in the DOM (cngx ARIA convention). */
  protected readonly ariaInvalid = computed(() => (this.shown() ? 'true' : 'false'));

  /** @internal - the message id, referenced only while the error is shown. */
  protected readonly ariaErrorMessage = computed(() => {
    const id = this.cngxErrorMessageId();
    return this.shown() && id && id.length > 0 ? id : null;
  });

  constructor() {
    if (
      typeof ngDevMode !== 'undefined' &&
      ngDevMode &&
      inject(CNGX_FORM_FIELD_CONTROL, { optional: true, self: true })
    ) {
      cngxDevWarn(
        'CNGX1084',
        '[cngxErrorState] shares its host with a form-field control, which binds ' +
          'aria-invalid and aria-errormessage itself. Drop [cngxErrorState] there; ' +
          'the control reports its error state to cngx-form-field.',
        inject(ElementRef).nativeElement,
      );
    }
  }
}
